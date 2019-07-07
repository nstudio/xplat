import { IXplatSchema } from '@nstudio/workspace';

export interface Schema extends IXplatSchema {
  /**
   * Target platforms
   */
  platforms?: string;
}
