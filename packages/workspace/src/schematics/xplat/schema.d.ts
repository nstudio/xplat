import { IXplatSchema } from "../../utils/xplat";

export interface Schema extends IXplatSchema {
  /**
   * Target platforms
   */
  platforms?: string;
}
