import {
  AuthorizationType,
  FieldExecuteCode,
  FieldType,
  FormItemComponent,
  fieldDecoratorKit,
} from 'dingtalk-docs-cool-app';

type FetchContext = {
  fetch: (
    url: string,
    options: Record<string, unknown>,
    authId?: string,
  ) => Promise<{ json: () => Promise<unknown> }>;
};

const { t } = fieldDecoratorKit;

/** ueaigc 生图 API：https://ai.ueaigc.com */
const API_DOC_URL = 'https://ai.ueaigc.com';
const API_HOST = 'ai.ueaigc.com';
const AUTH_ID = 'ueaigc';
const GENERATE_PATH = '/v1/images/generations';
const TASK_PATH_PREFIX = '/v1/tasks/';

/**
 * 关联账号配置
 * - id：execute 里 context.fetch 第三个参数
 * - platform：须为钉钉已登记的授权平台标识（与官方生图模板 aimaxhug 一致，否则可能不显示「关联账号」）
 * - label：配置面板展示名称，可为 ueaigc
 */
const ueaigcAuthorization = {
  id: AUTH_ID,
  platform: 'ueaigc',
  type: AuthorizationType.HeaderBearerToken,
  required: true,
  label: 'ueaigc',
  tooltips: '请关联 ueaigc 账号（API Key，见 https://ai.ueaigc.com 获取）',
  instructionsUrl: API_DOC_URL,
  icon: {
    light: 'https://ai.ueaigc.com/img/logo.png',
    dark: 'https://ai.ueaigc.com/img/logo.png',
  },
};

type AttachmentInput = Array<{
  name: string;
  type: string;
  size: number;
  tmp_url: string;
}>;

type ImageGenFormData = {
  prompt: string;
  sourceImage?: AttachmentInput | AttachmentInput[number];
  resolution: string;
  ratio: string;
  model: string;
  imageCount?: string | number;
};

/** API 参数 n：单次生成图片张数 */
const IMAGE_COUNT_MIN = 1;
const IMAGE_COUNT_MAX = 5;

/** 下拉项 key 不使用冒号，避免 schema 校验失败 */
const RATIO_KEY_TO_API: Record<string, string> = {
  auto: 'auto',
  r1x1: '1:1',
  r16x9: '16:9',
  r9x16: '9:16',
  r4x3: '4:3',
  r3x4: '3:4',
  r21x9: '21:9',
  r9x21: '9:21',
};

/** GPT-image 模型名，见 https://ai.ueaigc.com */
const MODEL_KEY_TO_API: Record<string, string> = {
  'gpt-image-2': 'gpt-image-2',
  'gpt-image-1.5': 'gpt-image-1.5',
  'gpt-image-2-official': 'gpt-image-2',
  'gpt-image-1.5-official': 'gpt-image-1.5',
};

fieldDecoratorKit.setDomainList([API_HOST]);

fieldDecoratorKit.setDecorator({
  name: 'AI 生图多模型',
  i18nMap: {
    'zh-CN': {
      tagline: '支持多种生图模型，可自定义提示词、参考图、分辨率、比例、模型与生成张数',
      authLabel: 'ueaigc',
      authTooltips: '请关联 ueaigc 账号以调用生图 API',
      promptLabel: '提示词',
      promptPlaceholder: '请输入你希望AI完成的任务',
      sourceImageLabel: '参考图',
      sourceImageTooltip:
        '可选。选择表格中的「附件」字段作为参考图，用于图生图/风格参考；图片需可被 API 访问（公网 URL）。不选则仅根据提示词文生图。',
      resolutionLabel: '分辨率',
      resolutionPlaceholder:
        '填写 1k / 2k / 4k 或引用字段。1k=低清快、2k=推荐、4k=高清慢；对应 quality 为 low / medium / high',
      resolutionTooltip:
        '控制出图清晰度（映射为 API 的 quality 参数）。1k 适合草稿与批量试稿；2k 适合多数业务配图；4k 适合海报、印刷级细节。支持引用字段，按行动态切换分辨率。',
      ratioLabel: '比例',
      ratioPlaceholder:
        '填写 auto、1:1、16:9、9:16、4:3、3:4 等或引用字段。横图 16:9/4:3 为 1536x1024，竖图 9:16/3:4 为 1024x1536，方图 1:1 为 1024x1024',
      ratioTooltip:
        '控制成片宽高比（映射为 API 的 size：1024×1024 / 1536×1024 / 1024×1536）。横版适合 Banner、封面；竖版适合手机海报、短视频封面；方图适合头像、商品主图。auto 在不确定比例时使用。',
      modelLabel: 'AI 模型',
      modelPlaceholder: 'gpt-image-2 或 gpt-image-1.5，或点击「引用字段」',
      modelTooltip: 'GPT Image 系列官方模型',
      imageCountLabel: '生成张数',
      imageCountPlaceholder:
        '填写 1-5 的整数，或引用字段。不填默认为 1；对应 API 参数 n',
      imageCountTooltip:
        '一次请求生成的图片数量。可引用数字/文本字段，按行生成不同张数。',
      errorImageCountInvalid: '生成张数须为 1-5 的整数',
      res1k: '1K（默认）',
      res2k: '2K',
      res4k: '4K',
      ratioAuto: '自动',
      errorPromptRequired: '请填写提示词',
      errorNoImage: '未获取到生成图片，请检查授权与 API 配置',
      errorApi: '生图请求失败，请稍后重试',
      errorAuth: '请先关联 ueaigc 账号',
    },
    'en-US': {
      tagline: 'Top-tier image gen — stable Chinese text, rich details.',
      authLabel: 'ueaigc',
      authTooltips: 'Link your ueaigc account to call the image API',
      promptLabel: 'Prompt',
      promptPlaceholder: 'Describe the image you want the AI to create',
      sourceImageLabel: 'Reference image',
      sourceImageTooltip:
        'Optional. Pick an Attachment column as reference for image-to-image; image must be reachable by the API (public URL). Leave empty for text-to-image only.',
      resolutionLabel: 'Resolution',
      resolutionPlaceholder:
        'Enter 1k, 2k, or 4k, or use Reference Field. Maps to quality low / medium / high',
      resolutionTooltip:
        'Maps to API quality. 1k for drafts; 2k for most production use; 4k for posters and fine detail. Supports per-row values via Reference Field.',
      ratioLabel: 'Aspect ratio',
      ratioPlaceholder:
        'Enter auto, 1:1, 16:9, 9:16, 4:3, 3:4, or use Reference Field. Landscape 1536x1024, portrait 1024x1536, square 1024x1024',
      ratioTooltip:
        'Maps to API size (1024×1024 / 1536×1024 / 1024×1536). Landscape for banners; portrait for mobile; square for avatars and product shots.',
      modelLabel: 'AI model',
      modelPlaceholder: 'Enter model name, or use Reference Field',
      modelTooltip: 'Official GPT Image models',
      imageCountLabel: 'Image count',
      imageCountPlaceholder:
        'Integer 1-10, or use Reference Field. Default 1; maps to API parameter n',
      imageCountTooltip:
        'Number of images per request. Reference a column for per-row counts.',
      errorImageCountInvalid: 'Image count must be an integer from 1 to 10',
      res1k: '1K (default)',
      res2k: '2K',
      res4k: '4K',
      ratioAuto: 'Auto',
      errorPromptRequired: 'Prompt is required',
      errorNoImage: 'No image returned. Check auth and API settings',
      errorApi: 'Image generation failed. Please try again',
      errorAuth: 'Please link your ueaigc account first',
    },
    'ja-JP': {
      tagline: '最強の画像生成。中国語も安定、ディテール豊か。',
      authLabel: 'ueaigc',
      authTooltips: 'ueaigc アカウントを連携して画像 API を利用してください',
      promptLabel: 'プロンプト',
      promptPlaceholder: 'AI に完了してほしいタスクを入力してください',
      sourceImageLabel: '参考画像',
      sourceImageTooltip:
        '任意。添付フィールドを参考画像として image-to-image に利用。API からアクセス可能な URL が必要。未選択時はプロンプトのみで生成。',
      resolutionLabel: '解像度',
      resolutionPlaceholder:
        '1k / 2k / 4k またはフィールド参照。quality は low / medium / high に対応',
      resolutionTooltip:
        'API の quality に対応。1k は試作、2k は通常利用、4k はポスター・細部重視向け。行ごとにフィールド参照可。',
      ratioLabel: '比率',
      ratioPlaceholder:
        'auto、1:1、16:9、9:16 等またはフィールド参照。横 1536x1024、縦 1024x1536、正方形 1024x1024',
      ratioTooltip:
        'API の size に対応。横長はバナー、縦長はモバイル向け、正方形はサムネ・商品画像向け。',
      modelLabel: 'AI モデル',
      modelPlaceholder: 'モデル名を入力、または「フィールド参照」',
      modelTooltip: 'GPT Image 公式モデル',
      imageCountLabel: '生成枚数',
      imageCountPlaceholder:
        '1-10 の整数、またはフィールド参照。未入力は 1（API パラメータ n）',
      imageCountTooltip:
        '1 回のリクエストで生成する画像枚数。行ごとにフィールド参照可。',
      errorImageCountInvalid: '生成枚数は 1-5 の整数で入力してください',
      res1k: '1K（デフォルト）',
      res2k: '2K',
      res4k: '4K',
      ratioAuto: '自動',
      errorPromptRequired: 'プロンプトを入力してください',
      errorNoImage: '画像が取得できませんでした。認証と API 設定を確認してください',
      errorApi: '画像生成に失敗しました。しばらくして再試行してください',
      errorAuth: '先に ueaigc アカウントを連携してください',
    },
  },
  // 须为数组，否则配置面板不展示「+ 关联账号」
  authorizations: [ueaigcAuthorization] as any,
  errorMessages: {
    promptRequired: t('errorPromptRequired'),
    noImage: t('errorNoImage'),
    apiError: t('errorApi'),
    authRequired: t('errorAuth'),
    imageCountInvalid: t('errorImageCountInvalid'),
  },
  formItems: [
    {
      key: 'prompt',
      label: t('promptLabel'),
      component: FormItemComponent.Textarea,
      props: {
        placeholder: t('promptPlaceholder'),
        enableFieldReference: true,
      },
      validator: {
        required: true,
      },
    },
    {
      key: 'sourceImage',
      label: t('sourceImageLabel'),
      component: FormItemComponent.FieldSelect,
      props: {
        mode: 'single',
        supportTypes: [FieldType.Attachment],
      },
      validator: {
        required: false,
      },
    },
    {
      key: 'resolution',
      label: t('resolutionLabel'),
      component: FormItemComponent.Textarea,
      props: {
        placeholder: t('resolutionPlaceholder'),
        enableFieldReference: true,
      },
      validator: {
        required: true,
      },
    },
    {
      key: 'ratio',
      label: t('ratioLabel'),
      component: FormItemComponent.Textarea,
      props: {
        placeholder: t('ratioPlaceholder'),
        enableFieldReference: true,
      },
      validator: {
        required: true,
      },
    },
    {
      key: 'model',
      label: t('modelLabel'),
      component: FormItemComponent.Textarea,
      props: {
        placeholder: t('modelPlaceholder'),
        enableFieldReference: true,
      },
      validator: {
        required: true,
      },
    },
    {
      key: 'imageCount',
      label: t('imageCountLabel'),
      component: FormItemComponent.Textarea,
      props: {
        placeholder: t('imageCountPlaceholder'),
        enableFieldReference: true,
      },
      validator: {
        required: false,
      },
    },
  ],
  resultType: {
    type: FieldType.Attachment,
  },
  execute: async (context, formData: ImageGenFormData) => {
    const prompt = (formData.prompt || '').trim();
    if (!prompt) {
      return {
        code: FieldExecuteCode.InvalidArgument,
        errorMessage: 'promptRequired',
      };
    }

    const refImageUrls = collectAttachmentUrls(formData.sourceImage);
    const imageCount = normalizeImageCount(formData.imageCount);
    if (imageCount === null) {
      return {
        code: FieldExecuteCode.InvalidArgument,
        errorMessage: 'imageCountInvalid',
      };
    }

    const body = buildChatfireImageBody(prompt, formData, refImageUrls, imageCount);

    try {
      const resultUrls = await fetchAllImageUrls(context, body, imageCount);

      if (resultUrls.length === 0) {
        return {
          code: FieldExecuteCode.Error,
          errorMessage: 'noImage',
        };
      }

      const stamp = Date.now();
      return {
        code: FieldExecuteCode.Success,
        data: resultUrls.map((url, index) => ({
          fileName: `gpt-image-${stamp}-${index + 1}.png`,
          type: 'image/png',
          url,
        })),
      };
    } catch (e) {
      const message = String(e);
      if (/401|403|authorization/i.test(message)) {
        return {
          code: FieldExecuteCode.AuthorizationError,
          errorMessage: 'authRequired',
          msg: message,
        };
      }
      return {
        code: FieldExecuteCode.Error,
        errorMessage: 'apiError',
        msg: message,
      };
    }
  },
});

export default fieldDecoratorKit;

/** 按 ueaigc GPT-image 接口组装请求体 */
function buildChatfireImageBody(
  prompt: string,
  formData: ImageGenFormData,
  imageUrls: string[],
  imageCount: number,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: normalizeModel(formData.model),
    prompt,
    size: resolveRatioToSize(formData.ratio),
    n: imageCount,
    quality: resolutionToQuality(formData.resolution),
    output_compression: 100,
    response_format: 'url',
  };
  if (imageUrls.length > 0) {
    body.image = imageUrls;
  }
  return body;
}

/** 分辨率映射为 API quality 参数 */
function resolutionToQuality(resolution?: string): string {
  const level = normalizeResolution(resolution);
  if (level === '4k') {
    return 'high';
  }
  if (level === '1k') {
    return 'low';
  }
  return 'medium';
}

/** 比例映射为 API size（1024x1024 | 1536x1024 | 1024x1536） */
function resolveRatioToSize(ratio?: string): string {
  const aspect = normalizeRatio(ratio);
  if (aspect === '9:16' || aspect === '9:21' || aspect === '3:4') {
    return '1024x1536';
  }
  if (aspect === '16:9' || aspect === '21:9' || aspect === '4:3') {
    return '1536x1024';
  }
  return '1024x1024';
}

/** 下拉选项或引用字段返回值统一为 API 使用的 1k / 2k / 4k */
function normalizeResolution(value?: string): string {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) {
    return '1k';
  }
  if (raw === '1k' || raw === '2k' || raw === '4k') {
    return raw;
  }
  if (/^1\s*k$/i.test(raw) || raw === '1024') {
    return '1k';
  }
  if (/^2\s*k$/i.test(raw) || raw === '2048') {
    return '2k';
  }
  if (/^4\s*k$/i.test(raw) || raw === '4096' || raw === '3840') {
    return '4k';
  }
  return raw;
}

/** 下拉 key（r16x9）或引用字段值（16:9、自动）统一为 API 比例 */
function normalizeRatio(value?: string): string {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return 'auto';
  }
  if (RATIO_KEY_TO_API[raw]) {
    return RATIO_KEY_TO_API[raw];
  }
  const lower = raw.toLowerCase();
  if (lower === 'auto' || raw === '自动' || raw === '自動') {
    return 'auto';
  }
  if (/^\d+\s*:\s*\d+$/.test(raw)) {
    return raw.replace(/\s/g, '');
  }
  return raw;
}

/** 下拉 key 或引用字段展示名（GPT Image 2）统一为 API model */
function normalizeModel(value?: string): string {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return 'gpt-image-2';
  }
  if (MODEL_KEY_TO_API[raw]) {
    return MODEL_KEY_TO_API[raw];
  }
  const lower = raw.toLowerCase();
  if (
    lower.includes('1.5') ||
    lower.includes('1-5') ||
    lower.includes('image 1.5') ||
    lower.includes('image1.5')
  ) {
    return 'gpt-image-1.5';
  }
  if (
    lower.includes('gpt-image-2') ||
    lower.includes('image 2') ||
    lower.includes('image2') ||
    lower === 'gpt image 2'
  ) {
    return 'gpt-image-2';
  }
  return raw;
}

/** 解析生成张数（引用字段或手填），无效返回 null */
function normalizeImageCount(value?: string | number | null): number | null {
  if (value === null || value === undefined) {
    return 1;
  }
  if (typeof value === 'number') {
    return clampImageCount(Math.floor(value));
  }
  const raw = String(value).trim();
  if (!raw) {
    return 1;
  }
  const match = raw.match(/\d+/);
  if (!match) {
    return null;
  }
  return clampImageCount(parseInt(match[0], 10));
}

function clampImageCount(n: number): number | null {
  if (!Number.isFinite(n) || n < IMAGE_COUNT_MIN || n > IMAGE_COUNT_MAX) {
    return null;
  }
  return n;
}

/** 请求生图并凑齐 expectedCount 张（兼容 API 忽略 n 或异步分批出图） */
async function fetchAllImageUrls(
  context: FetchContext,
  body: Record<string, unknown>,
  expectedCount: number,
): Promise<string[]> {
  const collected: string[] = [];

  const appendUnique = (urls: string[]) => {
    for (const url of urls) {
      if (url && !collected.includes(url)) {
        collected.push(url);
      }
      if (collected.length >= expectedCount) {
        break;
      }
    }
  };

  const requestOnce = async (n: number) => {
    const res = await context.fetch(
      `https://${API_HOST}${GENERATE_PATH}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, n }),
      },
      AUTH_ID,
    );
    const json = await parseJsonResponse(res);
    return resolveImageUrls(context, json, n);
  };

  appendUnique(await requestOnce(expectedCount));

  let attempts = 0;
  while (collected.length < expectedCount && attempts < expectedCount + 2) {
    attempts += 1;
    const before = collected.length;
    appendUnique(await requestOnce(1));
    if (collected.length === before) {
      break;
    }
  }

  return collected.slice(0, expectedCount);
}

function collectAttachmentUrls(
  source?: AttachmentInput | AttachmentInput[number],
): string[] {
  if (!source) {
    return [];
  }
  if (Array.isArray(source)) {
    return source.map((item) => item.tmp_url).filter(Boolean);
  }
  if (typeof source === 'object' && source.tmp_url) {
    return [source.tmp_url];
  }
  return [];
}

async function parseJsonResponse(res: { json: () => Promise<unknown> }): Promise<any> {
  return res.json();
}

/** 从同步响应或异步 task 轮询中解析全部图片 URL（须等任务完成，避免只拿到首张） */
async function resolveImageUrls(
  context: FetchContext,
  payload: any,
  expectedCount = 1,
): Promise<string[]> {
  const taskId = payload?.task_id || payload?.data?.task_id || payload?.id;

  if (taskId) {
    let latest = payload;
    for (let i = 0; i < 30; i++) {
      if (i > 0) {
        await sleep(2000);
        const taskRes = await context.fetch(
          `https://${API_HOST}${TASK_PATH_PREFIX}${taskId}`,
          { method: 'GET' },
          AUTH_ID,
        );
        latest = await parseJsonResponse(taskRes);
      }

      const status = latest?.status || latest?.data?.status;
      const urls = extractUrlsFromPayload(latest);

      if (status === 'failed' || status === 'error') {
        return urls;
      }
      if (
        status === 'completed' ||
        status === 'succeeded' ||
        status === 'success'
      ) {
        return urls;
      }
      // 无 status 时：已拿到足够张数再返回
      if (!status && urls.length >= expectedCount) {
        return urls;
      }
    }
    return extractUrlsFromPayload(latest);
  }

  return extractUrlsFromPayload(payload);
}

function extractUrlsFromPayload(payload: any): string[] {
  if (!payload) {
    return [];
  }

  const urls: string[] = [];
  const pushUrl = (value: unknown) => {
    if (typeof value === 'string' && value.startsWith('http')) {
      urls.push(value);
    }
  };

  const fromItems = (list: unknown) => {
    if (!Array.isArray(list)) {
      return;
    }
    for (const item of list) {
      if (typeof item === 'string') {
        pushUrl(item);
        continue;
      }
      if (item && typeof item === 'object') {
        const row = item as Record<string, unknown>;
        pushUrl(row.url);
        pushUrl(row.image_url);
        pushUrl(row.imageUrl);
      }
    }
  };

  fromItems(payload?.data);
  fromItems(payload?.images);
  fromItems(payload?.output);
  fromItems(payload?.result?.data);
  fromItems(payload?.result?.images);

  if (Array.isArray(payload?.data?.urls)) {
    fromItems(payload.data.urls);
  }

  if (urls.length > 0) {
    return [...new Set(urls)];
  }

  pushUrl(payload?.url);
  pushUrl(payload?.image_url);
  pushUrl(payload?.result?.url);

  return [...new Set(urls)];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
