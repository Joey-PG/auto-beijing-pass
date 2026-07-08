export type CommandResult<T = unknown> = {
  ok: boolean;
  message: string;
  data?: T;
};

export function printResult(result: CommandResult): void {
  const prefix = result.ok ? 'OK' : 'ERROR';
  console.log(`${prefix}: ${result.message}`);
  if (result.data !== undefined) {
    console.log(JSON.stringify(result.data, null, 2));
  }
}
