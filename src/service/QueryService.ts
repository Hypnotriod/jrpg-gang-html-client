import { singleton } from 'tsyringe';
import queryString from 'query-string';

@singleton()
export default class QueryService {
    public get parsedQuery(): queryString.ParsedQuery<string> {
        return queryString.parse(location.search);
    };
}
