import { IHelperSchema } from '../../utils';

export interface Schema extends IHelperSchema {
  /**
   * Target platforms to generate helpers for.
   */
  platforms?: string;
}
