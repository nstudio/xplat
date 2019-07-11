import { IXplatSchema } from '@nstudio/xplat';

export interface Schema extends IXplatSchema {
  /**
   * Target platforms
   */
  platforms?: string;
}
