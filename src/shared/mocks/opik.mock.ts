export class Opik {
  constructor(config: any) {}
  trace(args: any) {
    return {
      id: 'mock-trace-id',
      ...args,
    };
  }
}
