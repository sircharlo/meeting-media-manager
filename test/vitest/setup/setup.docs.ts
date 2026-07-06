import { http, HttpResponse } from 'msw';

import { initHttpHandlers } from '../mocks/http';
import { releases } from './../mocks/github';

initHttpHandlers([
  http.get(
    `${import.meta.env.repository?.replace(
      'github.com',
      'api.github.com/repos',
    )}/releases`,
    () => HttpResponse.json(releases),
  ),
]);
