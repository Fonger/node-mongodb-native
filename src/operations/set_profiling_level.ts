import { CommandOperation, CommandOperationOptions } from './command';
import type { Callback } from '../utils';
import type { Server } from '../sdam/server';
import type { Db } from '../db';
import type { ClientSession } from '../sessions';
const levelValues = new Set(['off', 'slow_only', 'all']);

/** @public */
export enum ProfilingLevel {
  off = 'off',
  slowOnly = 'slow_only',
  all = 'all'
}

/** @public */
export type SetProfilingLevelOptions = CommandOperationOptions;

/** @internal */
export class SetProfilingLevelOperation extends CommandOperation<ProfilingLevel> {
  options: SetProfilingLevelOptions;
  level: ProfilingLevel;
  profile: 0 | 1 | 2;

  constructor(db: Db, level: ProfilingLevel, options: SetProfilingLevelOptions) {
    super(db, options);
    this.options = options;
    switch (level) {
      case ProfilingLevel.off:
        this.profile = 0;
        break;
      case ProfilingLevel.slowOnly:
        this.profile = 1;
        break;
      case ProfilingLevel.all:
        this.profile = 2;
        break;
      default:
        this.profile = 0;
        break;
    }

    this.level = level;
  }

  execute(server: Server, session: ClientSession, callback: Callback<ProfilingLevel>): void {
    const level = this.level;

    if (!levelValues.has(level)) {
      return callback(new Error('Error: illegal profiling level value ' + level));
    }

    super.executeCommand(server, session, { profile: this.profile }, (err, doc) => {
      if (err == null && doc.ok === 1) return callback(undefined, level);
      return err != null ? callback(err) : callback(new Error('Error with profile command'));
    });
  }
}
