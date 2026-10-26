package com.longlivy.tts

import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.ArrayDeque
import java.util.Locale
import java.util.Queue

private const val TAG = "LonglivyTts"

/**
 * A minimal Android TextToSpeech wrapper, deliberately separate from
 * `expo-speech`. `expo-speech`'s own module constructs its `TextToSpeech`
 * instance with `appContext.reactContext` (the Activity) and explicitly runs
 * `textToSpeech.shutdown()` in an `OnActivityDestroys` hook — confirmed on a
 * real Samsung S22 (Android 16) to mean that swiping LongLivy away in
 * Recent Apps destroys `MainActivity`, which unbinds the TTS engine
 * mid-workout even though the background location task and its headless JS
 * re-run keep executing for several more minutes afterward.
 *
 * This module instead binds to `applicationContext`, which outlives
 * `MainActivity`, and is never explicitly shut down — only the OS killing
 * the whole process ends it, which is the same point background tracking
 * itself stops anyway.
 */
class LonglivyTtsModule : Module() {
  private var ttsState = TtsState.PENDING
  private val pendingSpeech: Queue<PendingSpeech> = ArrayDeque()

  override fun definition() = ModuleDefinition {
    Name("LonglivyTts")

    AsyncFunction<Boolean>("isReady") {
      ttsState == TtsState.READY
    }

    AsyncFunction("speak") { text: String, language: String?, volume: Float? ->
      Log.i(TAG, "speak() called, state=$ttsState, text=\"$text\"")
      when (ttsState) {
        TtsState.READY -> speakOut(text, language, volume)
        TtsState.FAILED, TtsState.PENDING -> {
          pendingSpeech.add(PendingSpeech(text, language, volume))
          // Touch the lazy property to kick off (or retry) initialization.
          textToSpeech
        }
      }
      Unit
    }
  }

  private fun speakOut(text: String, language: String?, volume: Float?) {
    textToSpeech.language = language?.let {
      val locale = Locale(it)
      val availability = textToSpeech.isLanguageAvailable(locale)
      if (availability != TextToSpeech.LANG_MISSING_DATA && availability != TextToSpeech.LANG_NOT_SUPPORTED) {
        locale
      } else {
        Locale.getDefault()
      }
    } ?: Locale.getDefault()

    val params = Bundle().apply {
      volume?.let { putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, it.coerceIn(0f, 1f)) }
    }

    Log.i(TAG, "speakOut() invoking Android TextToSpeech.speak(), text=\"$text\"")
    textToSpeech.speak(text, TextToSpeech.QUEUE_ADD, params, text.hashCode().toString())
  }

  private val textToSpeech: TextToSpeech by lazy {
    val applicationContext = appContext.reactContext?.applicationContext
      ?: throw IllegalStateException("LonglivyTts: no application context available")
    Log.i(TAG, "Creating TextToSpeech bound to application context (not Activity)")
    TextToSpeech(applicationContext) { status ->
      synchronized(this@LonglivyTtsModule) {
        if (status == TextToSpeech.SUCCESS) {
          Log.i(TAG, "TTS engine init SUCCESS, flushing ${pendingSpeech.size} queued announcement(s)")
          ttsState = TtsState.READY
          val queued = pendingSpeech.toList()
          pendingSpeech.clear()
          queued.forEach { speakOut(it.text, it.language, it.volume) }
        } else {
          Log.w(TAG, "TTS engine init FAILED, status=$status")
          ttsState = TtsState.FAILED
        }
      }
    }
  }

  private data class PendingSpeech(val text: String, val language: String?, val volume: Float?)

  private enum class TtsState { PENDING, READY, FAILED }
}
