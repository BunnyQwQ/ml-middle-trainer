import { l, same } from '@/i18n/types';
import type { PythonTask, SkillNode } from '@/content/types';

/**
 * One deterministic fixture for all ten tasks: the same search logs as the SQL
 * branch, only as DataFrames. Built in the preamble so every task starts from
 * identical data and the hidden tests can recompute the answer by hand.
 */
const PREAMBLE = `import pandas as pd
import random

_rnd = random.Random(20261022)
_rows = []
for _q in range(1, 81):
    _user = 1 + (_q % 15)
    _cat = ['phones', 'laptops', 'kitchen'][_q % 3]
    for _pos in range(1, 6):
        _rows.append({
            'query_id': _q,
            'user_id': _user,
            'category': _cat,
            'position': _pos,
            'is_ad': _pos <= 2,
            'clicked': _rnd.random() < 0.30 / _pos,
        })
events = pd.DataFrame(_rows)
orders = pd.DataFrame(
    [{'user_id': _u, 'revenue': 100.0 * (_u % 7 + 1)} for _u in range(1, 16) if _u % 3 != 0]
)
`;

function pandasTask(
  spec: Omit<PythonTask, 'kind' | 'packages' | 'preamble'>,
): PythonTask {
  return { kind: 'python', packages: ['pandas'], preamble: PREAMBLE, ...spec };
}

export const miniPandas: SkillNode = {
  id: 'mini.pandas',
  branch: 'mini',
  act: 4,
  tier: 3,
  title: l('Десять задач на pandas', 'Ten pandas tasks'),
  blurb: l(
    'Группировки, мерджи и оконные операции на тех же логах — без единого цикла.',
    'Grouping, merging and window operations over the same logs — without a single loop.',
  ),
  requires: ['boss.ranking-launch'],
  unlockLevel: 5,
  theory: [
    {
      type: 'p',
      text: l(
        'Десять коротких задач на тех же логах поиска, что в ветке SQL, только в виде датафреймов. Цель не изучить pandas, а привыкнуть выражать привычные по SQL операции векторно: группировка, мердж, оконная операция внутри группы. Циклов по строкам быть не должно ни в одной задаче — не из эстетики, а потому что на миллионе строк цикл работает минуты, а векторная операция доли секунды.',
        'Ten short tasks over the same search logs as the SQL branch, only as DataFrames. The goal is not to learn pandas but to get used to expressing familiar SQL operations vectorised: grouping, merging, a window operation inside a group. No row loops in any of the tasks — not for aesthetics but because on a million rows a loop takes minutes while a vectorised operation takes a fraction of a second.',
      ),
    },
    {
      type: 'code',
      lang: 'python',
      code: `events   # query_id, user_id, category, position, is_ad, clicked
orders   # user_id, revenue`,
      caption: l(
        'Эти два датафрейма уже созданы и доступны в каждой задаче. Первый запуск дольше обычного: в браузер подгружается pandas.',
        'These two frames are already created and available in every task. The first run takes longer than usual: pandas is being downloaded into the browser.',
      ),
    },
    {
      type: 'table',
      head: [same('SQL'), same('pandas')],
      rows: [
        [
          same('GROUP BY c HAVING count(*) > 5'),
          same('groupby(c).filter(lambda g: len(g) > 5)'),
        ],
        [same('avg(x) OVER (PARTITION BY c)'), same("groupby(c)['x'].transform('mean')")],
        [same('LEFT JOIN b USING (k)'), same("merge(b, on='k', how='left')")],
        [
          same('row_number() OVER (PARTITION BY c ORDER BY x DESC)'),
          same("groupby(c)['x'].rank(method='first', ascending=False)"),
        ],
      ],
      caption: l(
        'Соответствие, которое стоит держать в голове: почти всё из ветки SQL переводится механически.',
        'A correspondence worth keeping in mind: almost everything from the SQL branch translates mechanically.',
      ),
    },
  ],

  tasks: [
    pandasTask({
      id: 'mini.pandas.clicks-by-category',
      prompt: l(
        'Верни Series с числом кликов по каждой категории, отсортированную по убыванию. Индекс — название категории.',
        'Return a Series with the number of clicks per category, sorted descending. The index is the category name.',
      ),
      signature: 'def clicks_by_category(events) -> "pd.Series":',
      starter: `def clicks_by_category(events):
    # TODO
    return None
`,
      reference: `def clicks_by_category(events):
    return events[events['clicked']].groupby('category').size().sort_values(ascending=False)
`,
      sampleTests: `result = clicks_by_category(events)
assert len(result) == 3
assert result.iloc[0] >= result.iloc[-1]
`,
      tests: `expected = {}
for _, row in events.iterrows():
    if row['clicked']:
        expected[row['category']] = expected.get(row['category'], 0) + 1

result = clicks_by_category(events)
assert set(result.index) == set(expected), (set(result.index), set(expected))
for cat, count in expected.items():
    assert int(result[cat]) == count, (cat, result[cat], count)
# Sorted descending.
values = list(result.values)
assert values == sorted(values, reverse=True), values
`,
      writeup: l(
        'Фильтр по булевой колонке events[events["clicked"]] — основной способ отбора строк в pandas, прямой аналог WHERE. Дальше size() считает строки в группе, в отличие от count(), который считает непустые значения по каждой колонке и вернёт датафрейм. Обрати внимание на тест: ожидаемый ответ в нём собирается обычным циклом по строкам — именно так и надо проверять векторный код, независимым и заведомо понятным способом.',
        'Filtering with a boolean column, events[events["clicked"]], is the main way to select rows in pandas and the direct analogue of WHERE. Then size() counts rows in a group, unlike count(), which counts non-null values per column and returns a frame. Note the test: the expected answer there is assembled with an ordinary row loop — which is exactly how vectorised code should be checked, by an independent and obviously correct route.',
      ),
    }),

    pandasTask({
      id: 'mini.pandas.ctr-by-position',
      prompt: l(
        'Верни DataFrame с колонками position и ctr — доля кликов на каждой позиции. Отсортируй по position, индекс сбрось.',
        'Return a DataFrame with the columns position and ctr — the click share at each position. Sort by position and reset the index.',
      ),
      signature: 'def ctr_by_position(events) -> "pd.DataFrame":',
      starter: `def ctr_by_position(events):
    # TODO
    return None
`,
      reference: `def ctr_by_position(events):
    series = events.groupby('position')['clicked'].mean()
    return series.rename('ctr').reset_index().sort_values('position').reset_index(drop=True)
`,
      sampleTests: `result = ctr_by_position(events)
assert list(result.columns) == ['position', 'ctr']
assert len(result) == 5
`,
      tests: `result = ctr_by_position(events)
assert list(result.columns) == ['position', 'ctr'], list(result.columns)
assert list(result['position']) == [1, 2, 3, 4, 5]

for pos in range(1, 6):
    subset = events[events['position'] == pos]
    want = subset['clicked'].sum() / len(subset)
    got = float(result.loc[result['position'] == pos, 'ctr'].iloc[0])
    assert abs(got - want) < 1e-12, (pos, got, want)

# CTR decays with position in this data.
assert float(result['ctr'].iloc[0]) > float(result['ctr'].iloc[-1])
`,
      writeup: l(
        'mean() по булевой колонке даёт долю истинных значений — в pandas True считается единицей, поэтому отдельный подсчёт не нужен. Дальше идёт типичная возня с индексом: groupby возвращает Series, у которой position оказывается в индексе, а не в колонке. rename задаёт имя будущей колонки значений, reset_index превращает индекс в обычную колонку. Второй reset_index(drop=True) после сортировки убирает старую нумерацию строк — без него индекс останется перемешанным, и сравнение с эталоном по позициям может повести себя неожиданно.',
        'mean() over a boolean column gives the share of true values — pandas treats True as one, so no separate counting is needed. What follows is the usual index shuffling: groupby returns a Series whose position lives in the index rather than a column. rename names the future value column and reset_index turns the index into an ordinary one. The second reset_index(drop=True) after sorting drops the old row numbering — without it the index stays shuffled and positional comparisons can behave unexpectedly.',
      ),
    }),

    pandasTask({
      id: 'mini.pandas.top-users',
      prompt: l(
        'Верни список из k пользователей с наибольшим числом кликов. При равенстве кликов — меньший user_id первым. Пользователей без кликов не включать.',
        'Return a list of the k users with the most clicks. On a tie, the smaller user_id comes first. Users with no clicks are excluded.',
      ),
      signature: 'def top_users(events, k: int) -> list:',
      starter: `def top_users(events, k):
    # TODO
    return []
`,
      reference: `def top_users(events, k):
    clicks = events[events['clicked']].groupby('user_id').size()
    ordered = clicks.sort_values(ascending=False, kind='mergesort')
    ordered = ordered.reset_index(name='clicks').sort_values(
        ['clicks', 'user_id'], ascending=[False, True]
    )
    return list(ordered['user_id'].head(k))
`,
      sampleTests: `top = top_users(events, 3)
assert len(top) == 3
assert len(set(top)) == 3
`,
      tests: `counts = {}
for _, row in events.iterrows():
    if row['clicked']:
        counts[row['user_id']] = counts.get(row['user_id'], 0) + 1
expected = [u for u, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))]

assert top_users(events, 3) == expected[:3], (top_users(events, 3), expected[:3])
assert top_users(events, 1) == expected[:1]
assert len(top_users(events, 100)) == len(expected)
assert top_users(events, 0) == []
`,
      writeup: l(
        'Главная тонкость — разрыв ничьей. sort_values по одной колонке в pandas по умолчанию использует быструю, но неустойчивую сортировку, поэтому при равном числе кликов порядок пользователей не определён и может меняться между версиями библиотеки. Надёжный способ — сортировать сразу по двум ключам с разным направлением, как в эталоне. Это ровно та же проблема, что и в SQL: ORDER BY по одной колонке при равных значениях не гарантирует порядок, и второй ключ нужен не для красоты, а для воспроизводимости.',
        'The subtlety is the tie-break. sort_values on a single column uses a fast but unstable sort by default, so with equal click counts the order of users is undefined and can change between library versions. The reliable route is sorting on two keys with different directions, as in the reference. This is exactly the SQL problem again: ORDER BY on one column guarantees nothing when values tie, and the second key is there for reproducibility rather than elegance.',
      ),
    }),

    pandasTask({
      id: 'mini.pandas.query-ctr',
      prompt: l(
        'Добавь к копии датафрейма колонку query_ctr — долю кликов внутри своего запроса. Исходный датафрейм менять нельзя, циклов быть не должно. Это оконная операция: avg(clicked) OVER (PARTITION BY query_id).',
        'Add a query_ctr column to a copy of the frame — the click share within its own query. The original frame must not change and there must be no loops. This is a window operation: avg(clicked) OVER (PARTITION BY query_id).',
      ),
      signature: 'def add_query_ctr(events) -> "pd.DataFrame":',
      starter: `def add_query_ctr(events):
    # TODO
    return events
`,
      reference: `def add_query_ctr(events):
    out = events.copy()
    out['query_ctr'] = out.groupby('query_id')['clicked'].transform('mean')
    return out
`,
      sampleTests: `result = add_query_ctr(events)
assert 'query_ctr' in result.columns
assert 'query_ctr' not in events.columns
assert len(result) == len(events)
`,
      tests: `result = add_query_ctr(events)

# The original frame is untouched and the length is preserved.
assert 'query_ctr' not in events.columns
assert len(result) == len(events)

# Every row of a query carries that query's share.
for query_id in [1, 7, 42, 80]:
    rows = events[events['query_id'] == query_id]
    want = rows['clicked'].sum() / len(rows)
    got = result.loc[result['query_id'] == query_id, 'query_ctr']
    assert abs(float(got.iloc[0]) - want) < 1e-12, (query_id, float(got.iloc[0]), want)
    assert got.nunique() == 1

# The value is a share, not a count.
assert result['query_ctr'].max() <= 1.0
`,
      writeup: l(
        'transform — это и есть оконная функция pandas: в отличие от agg, она возвращает результат той же длины, что исходный датафрейм, размножая значение группы по всем её строкам. Через merge то же самое пишется в три строки и работает медленнее. Копия в первой строке обязательна: без неё функция молча допишет колонку в датафрейм вызывающего кода, и это один из самых неприятных источников багов в pandas, потому что проявляется он далеко от места ошибки.',
        'transform is the pandas window function: unlike agg it returns a result of the same length as the original frame, broadcasting the group value across its rows. The same thing written through merge takes three lines and runs slower. The copy on the first line is mandatory: without it the function quietly appends a column to the caller\'s frame, which is one of the nastiest sources of pandas bugs because it surfaces far from the mistake.',
      ),
    }),

    pandasTask({
      id: 'mini.pandas.merge-revenue',
      prompt: l(
        'Собери по пользователям таблицу с колонками user_id, clicks и revenue. Нужны все пользователи, встречающиеся в events; у тех, кого нет в orders, revenue равна 0.0. Отсортируй по user_id, индекс сбрось.',
        'Build a per-user table with the columns user_id, clicks and revenue. Every user appearing in events must be present; for those absent from orders the revenue is 0.0. Sort by user_id and reset the index.',
      ),
      signature: 'def merge_revenue(events, orders) -> "pd.DataFrame":',
      starter: `def merge_revenue(events, orders):
    # TODO
    return None
`,
      reference: `def merge_revenue(events, orders):
    clicks = events.groupby('user_id')['clicked'].sum().rename('clicks').reset_index()
    merged = clicks.merge(orders, on='user_id', how='left')
    merged['revenue'] = merged['revenue'].fillna(0.0)
    return merged.sort_values('user_id').reset_index(drop=True)
`,
      sampleTests: `result = merge_revenue(events, orders)
assert list(result.columns) == ['user_id', 'clicks', 'revenue']
assert result['revenue'].isna().sum() == 0
`,
      tests: `result = merge_revenue(events, orders)

assert list(result.columns) == ['user_id', 'clicks', 'revenue'], list(result.columns)

# Every user from events is present, exactly once.
assert set(result['user_id']) == set(events['user_id'])
assert len(result) == events['user_id'].nunique()

# A left join, not an inner one: users with no order keep a zero.
no_orders = set(events['user_id']) - set(orders['user_id'])
assert len(no_orders) > 0
for user in no_orders:
    assert float(result.loc[result['user_id'] == user, 'revenue'].iloc[0]) == 0.0

# Clicks match a hand count.
counts = {}
for _, row in events.iterrows():
    counts[row['user_id']] = counts.get(row['user_id'], 0) + int(bool(row['clicked']))
for user, want in counts.items():
    assert int(result.loc[result['user_id'] == user, 'clicks'].iloc[0]) == want

assert list(result['user_id']) == sorted(result['user_id'])
`,
      writeup: l(
        'how="left" здесь не деталь, а суть задачи: по умолчанию merge делает inner join и молча выбрасывает пользователей без заказов — ровно та же ошибка, что INNER JOIN вместо LEFT JOIN в ветке SQL, и ловится она так же, проверкой числа строк до и после. После левого мерджа в revenue появляются NaN, и их надо заполнить явно: любая арифметика с NaN даст NaN, и суммарная выручка превратится в пустоту. Полезная привычка после каждого merge — сравнивать len до и после: если выросло, ключ справа не уникален и строки размножились.',
        'how="left" is not a detail here but the point of the task: by default merge does an inner join and silently drops users without orders — exactly the INNER-instead-of-LEFT mistake from the SQL branch, caught the same way, by comparing row counts before and after. A left merge leaves NaNs in revenue and they must be filled explicitly: any arithmetic with NaN yields NaN, and the total revenue turns into nothing. A useful habit after every merge is comparing len before and after: if it grew, the right-hand key is not unique and rows multiplied.',
      ),
    }),

    pandasTask({
      id: 'mini.pandas.first-click',
      prompt: l(
        'Верни Series: для каждого запроса, где был хотя бы один клик, позицию первого кликнутого документа. Индекс — query_id, отсортируй по индексу. Запросы без кликов в результат не попадают.',
        'Return a Series: for each query with at least one click, the position of the first clicked document. The index is query_id, sorted. Queries with no clicks do not appear.',
      ),
      signature: 'def first_click_position(events) -> "pd.Series":',
      starter: `def first_click_position(events):
    # TODO
    return None
`,
      reference: `def first_click_position(events):
    clicked = events[events['clicked']]
    return clicked.groupby('query_id')['position'].min().sort_index()
`,
      sampleTests: `result = first_click_position(events)
assert result.min() >= 1
assert len(result) <= events['query_id'].nunique()
`,
      tests: `result = first_click_position(events)

expected = {}
for _, row in events.iterrows():
    if row['clicked']:
        q = row['query_id']
        expected[q] = min(expected.get(q, 99), row['position'])

assert set(result.index) == set(expected), (len(result), len(expected))
for q, want in expected.items():
    assert int(result[q]) == want, (q, int(result[q]), want)

# Queries without clicks are absent rather than present with a zero.
clicked_queries = set(events.loc[events['clicked'], 'query_id'])
silent = set(events['query_id']) - clicked_queries
assert len(silent) > 0
for q in silent:
    assert q not in result.index

assert list(result.index) == sorted(result.index)
`,
      writeup: l(
        'Эта задача — прямой перевод SQL-запроса на MRR из ветки метрик поиска, и у неё та же развилка: что делать с запросами без кликов. Здесь по условию их надо исключить, и фильтр перед группировкой делает это сам. Но если считать MRR, такие запросы обязаны войти в знаменатель с нулевым вкладом — и тогда понадобится reindex по всем query_id с заполнением. Разница между «отфильтровали» и «заполнили нулями» — это разница между метрикой, посчитанной по удачным запросам, и метрикой, посчитанной по всем.',
        'This task is a direct translation of the MRR query from the search metrics branch, and it has the same fork: what to do with queries that had no clicks. The statement excludes them, and the filter before the grouping does that by itself. But if you were computing MRR, such queries would have to enter the denominator with a zero contribution — and then a reindex over all query_ids with a fill value is needed. The difference between "filtered out" and "filled with zeros" is the difference between a metric over the successful queries and a metric over all of them.',
      ),
    }),

    pandasTask({
      id: 'mini.pandas.pivot',
      prompt: l(
        'Построй сводную таблицу: строки — категории, колонки — is_ad (False и True), значения — CTR. Используй pivot_table. Отсортируй строки по названию категории.',
        'Build a pivot table: rows are categories, columns are is_ad (False and True), values are CTR. Use pivot_table. Sort the rows by category name.',
      ),
      signature: 'def ad_vs_organic(events) -> "pd.DataFrame":',
      starter: `def ad_vs_organic(events):
    # TODO
    return None
`,
      reference: `def ad_vs_organic(events):
    table = events.pivot_table(
        index='category', columns='is_ad', values='clicked', aggfunc='mean'
    )
    return table.sort_index()
`,
      sampleTests: `table = ad_vs_organic(events)
assert table.shape == (3, 2)
assert list(table.index) == sorted(table.index)
`,
      tests: `table = ad_vs_organic(events)

assert table.shape == (3, 2), table.shape
assert set(table.columns) == {False, True}, list(table.columns)
assert list(table.index) == sorted(set(events['category']))

for cat in set(events['category']):
    for is_ad in (False, True):
        subset = events[(events['category'] == cat) & (events['is_ad'] == is_ad)]
        want = subset['clicked'].sum() / len(subset)
        got = float(table.loc[cat, is_ad])
        assert abs(got - want) < 1e-12, (cat, is_ad, got, want)
`,
      writeup: l(
        'pivot_table — это GROUP BY по двум осям сразу, с раскладкой второй оси по колонкам. Ключевой параметр aggfunc: по умолчанию там mean, что здесь случайно совпало с нужным, но полагаться на умолчание не стоит — на другой задаче получится среднее там, где нужна сумма. Второй момент: pivot_table молча выбрасывает комбинации, которых нет в данных, оставляя NaN. Если нужна полная сетка, добавляют fill_value или dropna=False, иначе таблица окажется разной формы на разных срезах данных, и код, который на неё опирается, однажды упадёт.',
        'pivot_table is a GROUP BY along two axes at once, with the second axis spread across columns. The key parameter is aggfunc: it defaults to mean, which happens to be what we want here, but relying on the default is unwise — on another task you get an average where a sum was needed. The second point: pivot_table silently drops combinations absent from the data, leaving NaN. For a complete grid you add fill_value or dropna=False, otherwise the table has a different shape on different slices and the code relying on it eventually breaks.',
      ),
    }),

    pandasTask({
      id: 'mini.pandas.rolling',
      prompt: l(
        'Реализуй скользящее среднее: на вход Series и размер окна, на выходе Series той же длины, где каждое значение — среднее по window последним элементам включительно. Первые window-1 значений должны быть NaN. Используй rolling, без циклов.',
        'Implement a rolling mean: the input is a Series and a window size, the output a Series of the same length where each value is the mean of the last window elements inclusive. The first window-1 values must be NaN. Use rolling, no loops.',
      ),
      signature: 'def rolling_mean(series, window: int) -> "pd.Series":',
      starter: `def rolling_mean(series, window):
    # TODO
    return series
`,
      reference: `def rolling_mean(series, window):
    return series.rolling(window=window, min_periods=window).mean()
`,
      sampleTests: `import pandas as pd

s = pd.Series([1.0, 2.0, 3.0, 4.0])
out = rolling_mean(s, 2)
assert pd.isna(out.iloc[0])
assert out.iloc[1] == 1.5 and out.iloc[3] == 3.5
`,
      tests: `import pandas as pd

s = pd.Series([1.0, 2.0, 3.0, 4.0, 5.0])

out = rolling_mean(s, 3)
assert len(out) == len(s)
assert pd.isna(out.iloc[0]) and pd.isna(out.iloc[1])
assert abs(out.iloc[2] - 2.0) < 1e-12
assert abs(out.iloc[4] - 4.0) < 1e-12

# A window of one changes nothing.
assert list(rolling_mean(s, 1).values) == list(s.values)

# A window as long as the series leaves exactly one number at the end.
out = rolling_mean(s, 5)
assert out.notna().sum() == 1
assert abs(out.iloc[-1] - 3.0) < 1e-12

# Works on the daily CTR of the logs too.
daily = events.groupby('query_id')['clicked'].mean()
smoothed = rolling_mean(daily, 7)
assert len(smoothed) == len(daily)
assert smoothed.notna().sum() == len(daily) - 6
`,
      writeup: l(
        'Всё держится на min_periods. По умолчанию rolling(window=3) уже требует трёх наблюдений, но стоит написать min_periods=1 — и первые значения посчитаются по неполному окну, то есть первое число будет средним по одному элементу. Для сглаживания графика это иногда удобно, а для метрики — почти всегда ложь: начало ряда окажется заметно шумнее остального, и на дашборде это выглядит как настоящий эффект. Явное min_periods=window делает намерение видимым в коде.',
        'Everything rests on min_periods. By default rolling(window=3) already requires three observations, but write min_periods=1 and the first values are computed over a partial window, so the first number is the mean of a single element. For smoothing a chart that is sometimes convenient; for a metric it is almost always a lie: the start of the series comes out noticeably noisier than the rest, and on a dashboard that looks like a real effect. An explicit min_periods=window makes the intent visible in the code.',
      ),
    }),

    pandasTask({
      id: 'mini.pandas.rank-in-group',
      prompt: l(
        'Для каждой категории проставь позициям ранг по числу кликов: ранг 1 у позиции с наибольшим числом кликов внутри этой категории. Верни DataFrame с колонками category, position, clicks, rank_in_category, отсортированный по category и rank_in_category. Ранг целочисленный, ничьи разрываются меньшей позицией. Циклов быть не должно.',
        'Within each category, rank the positions by click count: rank 1 goes to the position with the most clicks in that category. Return a DataFrame with the columns category, position, clicks, rank_in_category, sorted by category and rank_in_category. The rank is an integer and ties are broken by the smaller position. No loops.',
      ),
      signature: 'def rank_positions(events) -> "pd.DataFrame":',
      starter: `def rank_positions(events):
    # TODO
    return None
`,
      reference: `def rank_positions(events):
    grouped = (
        events.groupby(['category', 'position'])['clicked'].sum().rename('clicks').reset_index()
    )
    grouped = grouped.sort_values(['category', 'clicks', 'position'], ascending=[True, False, True])
    grouped['rank_in_category'] = grouped.groupby('category').cumcount() + 1
    return grouped.reset_index(drop=True)
`,
      sampleTests: `result = rank_positions(events)
assert list(result.columns) == ['category', 'position', 'clicks', 'rank_in_category']
assert set(result['rank_in_category']) == {1, 2, 3, 4, 5}
`,
      tests: `result = rank_positions(events)

assert list(result.columns) == ['category', 'position', 'clicks', 'rank_in_category']
assert len(result) == 15  # three categories by five positions

for cat in set(events['category']):
    block = result[result['category'] == cat]
    assert list(block['rank_in_category']) == [1, 2, 3, 4, 5], (cat, list(block['rank_in_category']))
    # Clicks do not increase as the rank grows.
    clicks = list(block['clicks'])
    assert clicks == sorted(clicks, reverse=True), (cat, clicks)
    # Rank one really is the maximum within the category.
    subset = events[events['category'] == cat]
    best = subset.groupby('position')['clicked'].sum().max()
    assert int(block['clicks'].iloc[0]) == int(best)

assert list(result['category']) == sorted(result['category'])
`,
      writeup: l(
        'Здесь два приёма, которые стоит запомнить. Первый — группировка по двум ключам сразу: groupby(["category", "position"]) даёт иерархический индекс, и reset_index раскладывает его обратно в колонки. Второй — cumcount() после сортировки как замена оконному row_number(). У pandas есть и метод rank(), но у него другое поведение при ничьих: по умолчанию он усредняет ранги и возвращает дробные числа, так что 1.5 вместо 1 и 2. Если нужен именно порядковый номер, как в SQL, то сортировка плюс cumcount честнее и предсказуемее.',
        'Two devices here are worth remembering. The first is grouping by two keys at once: groupby(["category", "position"]) gives a hierarchical index and reset_index spreads it back into columns. The second is cumcount() after sorting as a stand-in for the window function row_number(). pandas does have a rank() method, but it behaves differently on ties: by default it averages the ranks and returns fractions, so 1.5 instead of 1 and 2. When an ordinal number is what you want, as in SQL, sorting plus cumcount is more honest and more predictable.',
      ),
    }),

    pandasTask({
      id: 'mini.pandas.fill-missing',
      prompt: l(
        'Заполни пропуски в числовой колонке медианой её группы. На вход датафрейм, имя колонки с группой и имя числовой колонки. Верни копию с заполненной колонкой и дополнительной булевой колонкой был_пропуск с именем вида "<колонка>_was_missing". Если в группе все значения пропущены, оставь NaN. Исходный датафрейм менять нельзя.',
        'Fill the gaps in a numeric column with the median of its group. The input is a frame, the name of the group column and the name of the numeric column. Return a copy with the column filled and an extra boolean column named "<column>_was_missing". If a whole group is missing, leave NaN. The original frame must not change.',
      ),
      signature: 'def fill_missing(df, group_column: str, value_column: str) -> "pd.DataFrame":',
      starter: `def fill_missing(df, group_column, value_column):
    # TODO
    return df
`,
      reference: `def fill_missing(df, group_column, value_column):
    out = df.copy()
    out[value_column + '_was_missing'] = out[value_column].isna()
    medians = out.groupby(group_column)[value_column].transform('median')
    out[value_column] = out[value_column].fillna(medians)
    return out
`,
      sampleTests: `import pandas as pd

frame = pd.DataFrame({'g': ['a', 'a', 'b'], 'x': [1.0, None, 5.0]})
out = fill_missing(frame, 'g', 'x')
assert out['x'].tolist() == [1.0, 1.0, 5.0]
assert out['x_was_missing'].tolist() == [False, True, False]
assert frame['x'].isna().sum() == 1
`,
      tests: `import pandas as pd
import math

frame = pd.DataFrame({
    'g': ['a', 'a', 'a', 'b', 'b', 'c'],
    'x': [1.0, 3.0, None, 10.0, None, None],
})
out = fill_missing(frame, 'g', 'x')

# The original is untouched.
assert frame['x'].isna().sum() == 3

# Group medians, not the global one.
assert out['x'].iloc[2] == 2.0, out['x'].iloc[2]
assert out['x'].iloc[4] == 10.0, out['x'].iloc[4]

# A fully missing group stays missing rather than taking a global value.
assert math.isnan(out['x'].iloc[5])

# The flag records where the gaps were.
assert out['x_was_missing'].tolist() == [False, False, True, False, True, True]

# The flag is computed before the filling, not after.
assert out['x_was_missing'].sum() == 3
assert list(out.columns) == ['g', 'x', 'x_was_missing']
`,
      writeup: l(
        'Порядок операций здесь — вся задача. Флаг пропуска надо посчитать до заполнения, иначе он окажется пустым: после fillna пропусков уже нет. Сам флаг не формальность, а признак для модели: факт отсутствия значения часто информативнее любой подстановки, и выбрасывая его, теряют сигнал. Группа, в которой пропущено всё, остаётся с NaN, потому что медиана пустой группы не определена, — и это правильное поведение: подставлять туда глобальную медиану значит смешивать группы и создавать признак, которого в данных не было.',
        'The order of operations is the whole task. The missingness flag has to be computed before filling, otherwise it comes out empty: after fillna there are no gaps left. The flag is not a formality but a feature for the model: the fact that a value was absent is often more informative than any imputation, and discarding it throws away signal. A group where everything is missing keeps its NaN, because the median of an empty group is undefined — and that is the right behaviour: substituting the global median there mixes groups and invents a feature the data never had.',
      ),
    }),
  ],

  sources: [
    {
      title: 'pandas documentation: group by',
      url: 'https://pandas.pydata.org/docs/',
    },
  ],
};
