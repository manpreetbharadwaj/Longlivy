import { LocalStore } from '@/services/storage/LocalStore';
import { generateId } from '@/utils/id';
import type { ActivityRepository } from './ActivityRepository';
import type { Activity } from '../models';
import {
  ActivityRepositoryCore,
  type ActivityRecordBacking,
  type ActivityRepositoryClock,
  type ActivityRepositoryIdGenerator,
} from './ActivityRepositoryCore';

const ACTIVITY_STORE_KEY = '@longlivy/activity_db';
const store = new LocalStore<Activity[]>(ACTIVITY_STORE_KEY, []);

export interface LocalActivityRepositoryOptions {
  backing?: ActivityRecordBacking;
  read?: () => Promise<Activity[]>;
  write?: (value: Activity[]) => Promise<void>;
  clock?: ActivityRepositoryClock;
  idGenerator?: ActivityRepositoryIdGenerator;
  id?: ActivityRepositoryIdGenerator;
}

/** AsyncStorage-backed production adapter for the pure activity repository. */
export class LocalActivityRepository extends ActivityRepositoryCore {
  constructor(options: LocalActivityRepositoryOptions = {}) {
    const backing = options.backing ?? {
      read: options.read ?? (() => store.read()),
      // LocalStore intentionally remains best-effort; the adapter does not
      // add a second persistence layer or pretend writes are transactional.
      write: options.write ?? ((value: Activity[]) => store.write(value)),
    };
    super(backing, {
      clock: options.clock,
      idGenerator: options.idGenerator ?? options.id ?? ((prefix = 'activity') => generateId(prefix)),
    });
  }
}

export const activityRepository: ActivityRepository = new LocalActivityRepository();
