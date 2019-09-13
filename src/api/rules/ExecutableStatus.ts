export module ExecutableStatus {
  export enum Status {
    NOT_STARTED,
    RUNNING,
    EXITED,
    ERROR
  }

  export function toString(s: ExecutableStatus.Status): string {
    switch (s) {
      case ExecutableStatus.Status.RUNNING:
        return 'RUNNING'
      case ExecutableStatus.Status.EXITED:
        return 'EXITED'
      case ExecutableStatus.Status.ERROR:
        return 'ERROR'
      case ExecutableStatus.Status.NOT_STARTED:
        return 'NOT STARTED'
    }
  }
}