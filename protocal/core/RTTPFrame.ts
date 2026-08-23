export class RTTPMassageFrame {
  private readonly START = "<RTTP_START>";
  private readonly END = "<RTTP_END>";

  private buffer = "";

  push(segment: Buffer<ArrayBufferLike>): string[] {
    this.buffer += new TextDecoder().decode(segment);

    const messages: string[] = [];

    while (true) {
      const startPos = this.buffer.indexOf(this.START);

      //start not appear yet
      if (startPos === -1) {
        const keepLength = this.partialStartLength();

        if (this.buffer.length > keepLength) {
          this.buffer = this.buffer.slice(-keepLength);
        }

        break;
      }

      /*
       * 2. Remove anything before START
       *
       * Example:
       *
       *   garbage<RTTP_START>
       *           ^
       *           startPos
       */
      if (startPos > 0) {
        this.buffer = this.buffer.slice(startPos);
      }

      /*
       * 3. Find END
       *
       * Start exists, but END may not have arrived yet.
       */
      const endPos = this.buffer.indexOf(this.END, this.START.length);

      if (endPos === -1) {
        /*
         * We have an incomplete message.
         *
         * Keep everything and wait for the next TCP segment.
         */
        break;
      }

      /*
       * 4. Extract the message
       *
       * buffer:
       *
       * <RTTP_START>
       * RTTP/1.0
       * OPERATION: REGISTER_DRIVER
       * <RTTP_END>
       */
      const messageStart = this.START.length;

      const message = this.buffer.slice(messageStart, endPos).trim();

      messages.push(message);

      /*
       * 5. Remove the processed message
       *
       * There might be another message immediately after it.
       *
       * <RTTP_START>...</RTTP_END><RTTP_START>...</RTTP_END>
       *                              ^
       */
      this.buffer = this.buffer.slice(endPos + this.END.length);
    }

    return messages;
  }

  /**
   * Find how much of the current buffer could be
   * the beginning of START.
   *
   * Example:
   *
   *   "<RTTP_STA"
   *
   * should be preserved.
   */
  private partialStartLength(): number {
    const max = Math.min(this.buffer.length, this.START.length - 1);

    for (let length = max; length > 0; length--) {
      const suffix = this.buffer.slice(-length);

      if (this.START.startsWith(suffix)) {
        return length;
      }
    }

    return 0;
  }

  clear() {
    this.buffer = "";
  }
}
