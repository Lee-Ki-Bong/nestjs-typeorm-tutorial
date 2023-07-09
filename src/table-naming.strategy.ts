import { NamingStrategyInterface, DefaultNamingStrategy } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

export class TableNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  private tbNamePrefix: string = '_tb';

  tableName(className: string, customName: string): string {
    const tbName = customName ? customName : snakeCase(className);
    return `${tbName}${this.tbNamePrefix}`;
  }
}
