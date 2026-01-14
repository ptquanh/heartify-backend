export abstract class BaseDTO {
  public get filter(): Record<any, any> {
    this.parseFilters();

    return this._filter;
  }

  protected _filter: Record<any, any> = {};

  protected parseFilters(): void {
    return;
  }

  public addFilter(data: Record<any, any>): void {
    Object.assign(this._filter, data);
  }
}
