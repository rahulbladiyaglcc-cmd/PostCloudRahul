import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DataSource } from 'typeorm';

@ValidatorConstraint({ name: 'ExistsRule', async: true })
@Injectable()
export class ExistsRule implements ValidatorConstraintInterface {
  constructor(private dataSource: DataSource) {}

  async validate(value: number | string, args: ValidationArguments) {
    const { constraints } = args;
    if (constraints.length === 0) {
      throw new BadRequestException(`Failed validating ${value} exists.`);
    }

    const str = constraints[0].split(':');
    const tableName = str[0];
    const columnName = str[1];
    const ignoreFieldName = str[2];
    const ignoreId = args.object[ignoreFieldName];

    let query = `SELECT count(*) FROM ${tableName} WHERE "${columnName}" = $1`;
    const params: (string | number)[] = [value];

    // Exclude the current record if `ignoreId` is provided
    if (ignoreId) {
      query += ` AND id != $2`; // Assuming `id` is the primary key column
      params.push(Number(ignoreId));
    }

    const result = await this.dataSource.query(query, params);

    // The record already exists. Failing the validation.
    if (result[0].count > 0) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const { property, value } = args;

    return `${property} ${value} is already exist.`;
  }
}
