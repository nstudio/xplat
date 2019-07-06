import { PlatformTypes } from '../../utils';

export interface Schema {
  /**
   * Development mode name
   */
  name?: PlatformTypes;
  /**
   * Project names to focus on
   */
  projects?: string;
}
