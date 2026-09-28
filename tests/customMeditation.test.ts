import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getTemplateAudioMode, parseCustomMinutes, templateToPlayerParams } from '../src/features/meditation/customMeditation';
import type { MeditationTemplate } from '../src/features/meditation/models';

const base: MeditationTemplate = {
  id: 'template_1',
  userId: 'user_demo_1',
  name: 'Evening rain',
  durationSeconds: 900,
  type: 'free',
  breathingEnabled: false,
  closingSoundEnabled: true,
};

test('a template saved before custom meditations existed still reads as a silent timer', () => {
  assert.equal(getTemplateAudioMode(base), 'silence');
  assert.deepEqual(templateToPlayerParams(base), {
    meditationId: null,
    type: 'free',
    durationSeconds: 900,
    ambientSoundId: null,
    title: 'Evening rain',
    templateId: 'template_1',
  });
});

test('a sound and no track is a sounds-only session (no primary audio, sound passed to the Player)', () => {
  const template = { ...base, backgroundSound: 'ambient_rain' };
  assert.equal(getTemplateAudioMode(template), 'sounds');
  const params = templateToPlayerParams(template);
  assert.equal(params.meditationId, null);
  assert.equal(params.ambientSoundId, 'ambient_rain');
});

test('a track makes it a music session, with the sound as an optional layer', () => {
  const withLayer = { ...base, contentId: 'med_35', backgroundSound: 'ambient_forest' };
  assert.equal(getTemplateAudioMode(withLayer), 'music');
  assert.deepEqual(
    { id: templateToPlayerParams(withLayer).meditationId, sound: templateToPlayerParams(withLayer).ambientSoundId },
    { id: 'med_35', sound: 'ambient_forest' }
  );
  const noLayer = { ...base, contentId: 'med_35' };
  assert.equal(templateToPlayerParams(noLayer).ambientSoundId, null);
});

test('the session keeps the template id and name so history can tell where it came from', () => {
  const params = templateToPlayerParams({ ...base, name: 'Morning reset', durationSeconds: 300 });
  assert.equal(params.templateId, 'template_1');
  assert.equal(params.title, 'Morning reset');
  assert.equal(params.durationSeconds, 300);
});

test('custom minutes accept whole numbers from 1 to 180 only', () => {
  assert.equal(parseCustomMinutes('1'), 1);
  assert.equal(parseCustomMinutes(' 45 '), 45);
  assert.equal(parseCustomMinutes('180'), 180);
  for (const bad of ['', '0', '181', '-5', '2.5', '10 min', 'abc', '1e2']) {
    assert.equal(parseCustomMinutes(bad), null, `"${bad}" should be rejected`);
  }
});
