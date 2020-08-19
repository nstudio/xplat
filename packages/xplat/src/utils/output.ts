// import chalk from 'chalk';

export interface CLIErrorMessageConfig {
  title: string;
  bodyLines?: string[];
  slug?: string;
}

export interface CLIWarnMessageConfig {
  title: string;
  bodyLines?: string[];
  slug?: string;
}

export interface CLILogMessageConfig {
  title: string;
  bodyLines?: string[];
}

export interface CLINoteMessageConfig {
  title: string;
  bodyLines?: string[];
}

export interface CLISuccessMessageConfig {
  title: string;
}

/**
 * Automatically disable styling applied by chalk if CI=true
 */
if (process.env.CI === 'true') {
  // chalk.level = 0;
}

class CLIOutput {
  // private readonly XPLAT_PREFIX = `${chalk.bgKeyword('orange')(
  //   '>'
  // )} ${chalk.reset.inverse.bold.bgKeyword('orange')(' NX ')}`;
  private readonly XPLAT_PREFIX = `> XPLAT `;
  /**
   * Longer dash character which forms more of a continuous line when place side to side
   * with itself, unlike the standard dash character
   */
  private readonly VERTICAL_SEPARATOR =
    '———————————————————————————————————————————————';

  /**
   * Expose some color and other utility functions so that other parts of the codebase that need
   * more fine-grained control of message bodies are still using a centralized
   * implementation.
   */
  // colors = {
  //   gray: chalk.gray,
  // };
  // bold = chalk.bold;
  // underline = chalk.underline;

  private writeToStdOut(str: string) {
    process.stdout.write(str);
  }

  private writeOutputTitle({
    label,
    title,
  }: {
    label?: string;
    title: string;
  }): void {
    let outputTitle: string;
    if (label) {
      outputTitle = `${this.XPLAT_PREFIX} ${label} ${title}\n`;
    } else {
      outputTitle = `${this.XPLAT_PREFIX} ${title}\n`;
    }
    this.writeToStdOut(outputTitle);
  }

  private writeOptionalOutputBody(bodyLines?: string[]): void {
    if (!bodyLines) {
      return;
    }
    this.addNewline();
    bodyLines.forEach((bodyLine) => this.writeToStdOut('  ' + bodyLine + '\n'));
  }

  addNewline() {
    this.writeToStdOut('\n');
  }

  addVerticalSeparator() {
    // this.writeToStdOut(`\n${chalk.gray(this.VERTICAL_SEPARATOR)}\n\n`);
    this.writeToStdOut(`\n${this.VERTICAL_SEPARATOR}\n\n`);
  }

  error({ title, slug, bodyLines }: CLIErrorMessageConfig) {
    this.addNewline();

    this.writeOutputTitle({
      label: ' ERROR ',//chalk.reset.inverse.bold.red(' ERROR '),
      title: title//chalk.bold.red(title),
    });

    this.writeOptionalOutputBody(bodyLines);

    /**
     * Optional slug to be used in an error message redirect URL
     */
    if (slug && typeof slug === 'string') {
      this.addNewline();
      // this.writeToStdOut(
      //   chalk.grey('  ' + 'Learn more about this error: ') +
      //     'https://nstudio.io/xplat/errors' +
      //     slug +
      //     '\n'
      // );
    }

    this.addNewline();
  }

  warn({ title, slug, bodyLines }: CLIWarnMessageConfig) {
    this.addNewline();

    this.writeOutputTitle({
      label: ' WARNING ',//chalk.reset.inverse.bold.yellow(' WARNING '),
      title: title//chalk.bold.yellow(title),
    });

    this.writeOptionalOutputBody(bodyLines);

    /**
     * Optional slug to be used in an warning message redirect URL
     */
    if (slug && typeof slug === 'string') {
      this.addNewline();
      // this.writeToStdOut(
      //   chalk.grey('  ' + 'Learn more about this warning: ') +
      //     'https://nstudio.io/xplat/errors' +
      //     slug +
      //     '\n'
      // );
    }

    this.addNewline();
  }

  note({ title, bodyLines }: CLINoteMessageConfig) {
    this.addNewline();

    this.writeOutputTitle({
      label: ' NOTE ',//chalk.reset.inverse.bold.keyword('orange')(' NOTE '),
      title: title//chalk.bold.keyword('orange')(title),
    });

    this.writeOptionalOutputBody(bodyLines);

    this.addNewline();
  }

  success({ title }: CLISuccessMessageConfig) {
    this.addNewline();

    this.writeOutputTitle({
      label: ' SUCCESS ',//chalk.reset.inverse.bold.green(' SUCCESS '),
      title: title//chalk.bold.green(title),
    });

    this.addNewline();
  }

  logSingleLine(message: string) {
    this.addNewline();

    this.writeOutputTitle({
      title: message,
    });

    this.addNewline();
  }

  log({ title, bodyLines }: CLIWarnMessageConfig) {
    this.addNewline();

    this.writeOutputTitle({
      title: title//chalk.white(title),
    });

    this.writeOptionalOutputBody(bodyLines);

    this.addNewline();
  }
}

export const output = new CLIOutput();
