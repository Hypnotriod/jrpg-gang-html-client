import { singleton } from 'tsyringe';
import queryString from 'query-string';

@singleton()
export default class QueryService {
    public readonly parsedQuery: queryString.ParsedQuery<string> = queryString.parse(location.search);
}
