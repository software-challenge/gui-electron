export module Helpers {

  export function getReadableTimestamp(d: Date): string {
    return ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2) + "." + ('000' + d.getMilliseconds()).slice(-3);
  }

  export function getLogLine(msg: string, time?) {
    if (!time) {
      time = new Date();
    }
    return `[${Helpers.getReadableTimestamp(time)}] ${msg}`;
  }

  export function log(msg: string) {
    console.log(Helpers.getLogLine(msg));
  }

}