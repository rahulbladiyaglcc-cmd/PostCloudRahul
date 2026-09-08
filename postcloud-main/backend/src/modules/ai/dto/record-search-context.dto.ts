import { RecordSearchFilterDto } from '../../records/dto/search/record-search-filter.dto';

export class RecordSearchContextDto {
  filters: RecordSearchFilterDto;
  limit: number;
  offset: number;
  total: number;
}
