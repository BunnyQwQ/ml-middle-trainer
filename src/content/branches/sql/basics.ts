import { l, same } from '@/i18n/types';
import type { SkillNode } from '@/content/types';

export const sqlBasics: SkillNode = {
  id: 'sql.basics',
  branch: 'sql',
  tier: 1,
  title: l('Выборки и джойны', 'Selects and joins'),
  blurb: l(
    'Логи устроены так, что половина ответов живёт в отсутствующих строках.',
    'Logs are built so that half the answers live in the rows that are missing.',
  ),
  requires: [],
  theory: [
    {
      type: 'p',
      text: l(
        'Схема, на которой стоит вся ветка, повторяет устройство настоящих поисковых логов. Событие поиска лежит в queries, каждый показанный документ — отдельная строка в impressions с позицией и флагом рекламы, а клик — строка в clicks. Ключевая деталь: показ без клика не имеет строки в clicks вообще. Поэтому «сколько показов не кликнули» нельзя посчитать, глядя только в clicks, и почти любая метрика качества начинается с LEFT JOIN.',
        'The schema the whole branch runs on mirrors how real search logs are laid out. A search event lives in queries, every shown document is its own row in impressions with a position and an ad flag, and a click is a row in clicks. The key detail: an impression with no click has no row in clicks at all. So "how many impressions went unclicked" cannot be answered from clicks alone, and almost every quality metric starts with a LEFT JOIN.',
      ),
    },
    {
      type: 'note',
      tone: 'key',
      text: l(
        'Главный вопрос при джойне логов: что происходит с мощностью таблицы. INNER JOIN молча выбрасывает строки, и метрика считается не по тем данным. LEFT JOIN сохраняет левую сторону, но только если ключ справа уникален — иначе строки размножатся, и показы посчитаются дважды.',
        'The first question when joining logs: what happens to the row count. An INNER JOIN silently drops rows and the metric ends up computed over the wrong data. A LEFT JOIN keeps the left side, but only if the key on the right is unique — otherwise rows multiply and impressions get counted twice.',
      ),
    },
    {
      type: 'table',
      head: [l('Что нужно', 'What you want'), l('Как это пишется', 'How it is written')],
      rows: [
        [
          l('Показы вместе с кликами, если они были', 'Impressions together with their clicks, if any'),
          same('impressions LEFT JOIN clicks'),
        ],
        [
          l('Только кликнутые показы', 'Only clicked impressions'),
          same('clicks JOIN impressions'),
        ],
        [
          l('Показы без кликов (антиджойн)', 'Impressions without clicks (anti-join)'),
          same('LEFT JOIN … WHERE clicks.click_id IS NULL'),
        ],
        [
          l('Категория вместе с родителем', 'A category together with its parent'),
          same('categories JOIN categories (self-join)'),
        ],
      ],
    },
    {
      type: 'p',
      text: l(
        'Антиджойн — это LEFT JOIN, после которого остаются только строки без пары. Условие IS NULL должно стоять в WHERE после джойна, а не внутри ON: в ON оно изменило бы само правило соединения, а не отфильтровало результат. Эту разницу любят спрашивать, и она же — источник молчаливых ошибок в продовых запросах.',
        'An anti-join is a LEFT JOIN that keeps only the rows with no match. The IS NULL condition belongs in WHERE after the join, not inside ON: in ON it would change the matching rule itself rather than filter the result. That difference comes up in interviews, and it is also a source of silent bugs in production queries.',
      ),
    },
    {
      type: 'sim',
      sim: 'join-explorer',
      title: l('Что джойн делает со строками', 'What a join does to your rows'),
      caption: l(
        'Две маленькие таблицы и четыре типа соединения. Смотри на счётчик строк: INNER теряет, LEFT сохраняет левую сторону, а при неуникальном ключе справа строк становится больше, чем было, — именно так CTR внезапно оказывается выше ста процентов.',
        'Two small tables and four join types. Watch the row counter: INNER loses rows, LEFT keeps the left side, and with a non-unique key on the right you end up with more rows than you started with — which is exactly how CTR suddenly exceeds one hundred percent.',
      ),
    },
    {
      type: 'note',
      tone: 'warn',
      text: l(
        'NULL не равен ничему, включая самого себя. Поэтому NOT IN с подзапросом, где встречается NULL, возвращает пустой результат — молча и без ошибки. Для антиджойна надёжнее LEFT JOIN … IS NULL или NOT EXISTS.',
        'NULL equals nothing, not even itself. So NOT IN against a subquery that contains a NULL returns an empty result, silently and without an error. For an anti-join, LEFT JOIN … IS NULL or NOT EXISTS is the safer form.',
      ),
    },
  ],

  tasks: [
    {
      kind: 'sql',
      id: 'sql.basics.filter-join',
      prompt: l(
        'Выведи товары из категории phones, которые есть в наличии и стоят дороже 5000. Две колонки: item_id, price. Сортировка по цене по убыванию, при равной цене — по item_id по возрастанию.',
        'List the items in the phones category that are in stock and cost more than 5000. Two columns: item_id, price. Sort by price descending, breaking ties by item_id ascending.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Категория задана именем, а в items лежит только category_id.
-- The category is given by name, while items only has category_id.
SELECT
FROM items
`,
      reference: `SELECT i.item_id, i.price
FROM items i
JOIN categories c ON c.category_id = i.category_id
WHERE c.name = 'phones' AND i.in_stock AND i.price > 5000
ORDER BY i.price DESC, i.item_id`,
      orderMatters: true,
      writeup: l(
        'Условие на имя категории требует джойна: в items есть только идентификатор. Обрати внимание на две мелочи. Первая: i.in_stock — это уже булево выражение, писать in_stock = TRUE не нужно. Вторая: сортировка с двумя ключами не прихоть задачи, а защита от недетерминированного порядка при равных ценах — в распределённой базе две одинаковые строки могут прийти из разных шардов в произвольном порядке, и запрос без второго ключа будет давать разный ответ от запуска к запуску.',
        'Filtering by category name requires a join: items only holds the id. Note two small things. First, i.in_stock is already a boolean expression, so in_stock = TRUE is noise. Second, sorting on two keys is not a whim of the task but protection against a non-deterministic order on equal prices — in a distributed database two identical rows can arrive from different shards in any order, and a query without the second key gives a different answer each run.',
      ),
      clickhouse: {
        code: `SELECT i.item_id, i.price
FROM items AS i
INNER JOIN categories AS c ON c.category_id = i.category_id
WHERE c.name = 'phones' AND i.in_stock AND i.price > 5000
ORDER BY i.price DESC, i.item_id`,
        note: l(
          'Запрос переносится почти дословно, но в ClickHouse псевдонимы принято писать через AS, а порядок таблиц в джойне важен для производительности: правая таблица целиком попадает в память, поэтому меньшую ставят справа. Здесь это categories, что уже правильно.',
          'The query carries over almost verbatim, but ClickHouse spells aliases with AS by convention, and the table order in a join matters for performance: the right-hand table is loaded into memory whole, so the smaller one goes on the right. Here that is categories, which is already the case.',
        ),
      },
    },
    {
      kind: 'sql',
      id: 'sql.basics.self-join',
      prompt: l(
        'Для каждой листовой категории выведи её имя и имя родителя. Две колонки: child_name, parent_name. Сортировка по child_name. Корневые категории (у которых нет родителя) выводить не нужно.',
        'For every leaf category output its name and its parent name. Two columns: child_name, parent_name. Sort by child_name. Root categories (the ones with no parent) should not appear.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Одна и та же таблица участвует дважды, под разными псевдонимами.
-- The same table takes part twice, under different aliases.
SELECT
FROM categories
`,
      reference: `SELECT child.name AS child_name, parent.name AS parent_name
FROM categories child
JOIN categories parent ON parent.category_id = child.parent_id
ORDER BY child_name`,
      orderMatters: true,
      writeup: l(
        'Self-join — обычный джойн таблицы с собой, в котором единственная сложность в том, чтобы не запутаться в псевдонимах. Условие parent.category_id = child.parent_id читается как «возьми ту строку, на которую указывает мой parent_id». Корневые категории отсекаются сами собой: у них parent_id равен NULL, а NULL не соединяется ни с чем, поэтому INNER JOIN их выбрасывает — дополнительного WHERE не нужно. Если бы корни требовалось оставить, понадобился бы LEFT JOIN. Так же, кстати, разворачивают иерархию категорий товаров в реальной задаче классификации запросов: сначала до родителя, а для произвольной глубины — рекурсивным CTE.',
        'A self-join is an ordinary join of a table with itself, where the only difficulty is keeping the aliases straight. The condition parent.category_id = child.parent_id reads as "take the row my parent_id points at". Root categories drop out on their own: their parent_id is NULL, and NULL joins to nothing, so the INNER JOIN discards them — no extra WHERE needed. Keeping the roots would require a LEFT JOIN. This is also how a product category hierarchy gets unrolled in a real query classification task: one level up like this, and a recursive CTE for arbitrary depth.',
      ),
      clickhouse: {
        code: `SELECT child.name AS child_name, parent.name AS parent_name
FROM categories AS child
INNER JOIN categories AS parent ON parent.category_id = child.parent_id
ORDER BY child_name`,
        note: l(
          'То же самое, но для словарей вроде категорий в ClickHouse обычно заводят внешний словарь и пишут dictGet(\'categories\', \'name\', parent_id) без джойна вовсе: словарь лежит в памяти, и такой доступ на порядок дешевле соединения.',
          'The same thing, but for lookup data like categories ClickHouse usually gets an external dictionary and you write dictGet(\'categories\', \'name\', parent_id) with no join at all: the dictionary sits in memory and that access is an order of magnitude cheaper than a join.',
        ),
      },
    },
    {
      kind: 'sql',
      id: 'sql.basics.anti-join',
      prompt: l(
        'Найди пользователей, которые не сделали ни одного заказа. Одна колонка: user_id. Сортировка по возрастанию.',
        'Find the users who made no orders at all. One column: user_id. Sorted ascending.',
      ),
      dataset: 'search-sample',
      hiddenDatasets: ['search-hidden-1', 'search-hidden-2'],
      starter: `-- Строки, которым не нашлось пары.
-- The rows that found no match.
SELECT
FROM users
`,
      reference: `SELECT u.user_id
FROM users u
LEFT JOIN orders o ON o.user_id = u.user_id
WHERE o.order_id IS NULL
ORDER BY u.user_id`,
      orderMatters: true,
      writeup: l(
        'Классический антиджойн: соединяем, а потом оставляем только то, чему не нашлось пары. Три детали. Первая: условие IS NULL обязано быть в WHERE — если перенести его в ON, оно станет частью правила соединения, и в ответ попадут вообще все пользователи. Вторая: проверять на NULL надо колонку правой таблицы, которая не может быть NULL сама по себе, то есть ключ — иначе настоящий NULL в данных притворится отсутствием строки. Третья: тот же результат даёт WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.user_id), и на больших таблицах планировщик обычно выбирает его же — но в отличие от NOT IN он безопасен при NULL в подзапросе.',
        'The classic anti-join: join, then keep only what found no match. Three details. First, the IS NULL condition must live in WHERE — move it into ON and it becomes part of the matching rule, so every user comes back. Second, the column you test for NULL must be one that cannot be NULL on its own, i.e. a key — otherwise a genuine NULL in the data masquerades as a missing row. Third, WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.user_id) gives the same answer and the planner usually picks the same plan on large tables — and unlike NOT IN it is safe when the subquery contains NULLs.',
      ),
      clickhouse: {
        code: `SELECT u.user_id
FROM users AS u
LEFT ANTI JOIN orders AS o ON o.user_id = u.user_id
ORDER BY u.user_id`,
        note: l(
          'В ClickHouse антиджойн есть как отдельный вид соединения — LEFT ANTI JOIN, и его стоит предпочитать. Причина не в красоте: в ClickHouse LEFT JOIN по умолчанию подставляет не NULL, а значение по умолчанию типа (ноль для чисел, пустую строку для строк), поэтому привычная проверка WHERE o.order_id IS NULL просто ничего не найдёт. Либо включают настройку join_use_nulls, либо пишут ANTI JOIN. Это одна из самых частых ловушек при переезде запросов с Postgres на ClickHouse.',
          'ClickHouse has the anti-join as a join type of its own — LEFT ANTI JOIN — and it is the form to prefer. Not for elegance: in ClickHouse a LEFT JOIN fills unmatched rows with the type default (zero for numbers, empty string for strings) rather than NULL, so the familiar WHERE o.order_id IS NULL finds nothing at all. You either turn on the join_use_nulls setting or write ANTI JOIN. This is one of the most common traps when moving queries from Postgres to ClickHouse.',
        ),
      },
    },
  ],

  sources: [
    {
      title: 'DuckDB documentation: SQL statements',
      url: 'https://duckdb.org/docs/',
      note: l('Диалект, на котором исполняются задачи.', 'The dialect the tasks run on.'),
    },
    {
      title: 'ClickHouse documentation: JOIN clause',
      url: 'https://clickhouse.com/docs',
      note: l('Виды соединений и поведение с NULL.', 'Join types and NULL behaviour.'),
    },
  ],
};
