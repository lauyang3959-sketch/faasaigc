/**
 * 修复 dingtalk-docs-cool-app manifest 授权区不展示问题：
 * 1. authorizations 输出为数组
 * 2. 同时在 props 与 schema 下挂载 authorizations
 * 3. getAuthertications 兼容数组
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const targets = [
  'node_modules/dingtalk-docs-cool-app/dist-node/module/fields/kit.js',
  'node_modules/dingtalk-docs-cool-app/dist-web/module/fields/kit.js',
];

const OLD_PROPS =
  'props:{schema:{authorizations:Array.isArray(t.authorizations)?t.authorizations:t.authorizations?[t.authorizations]:void 0,items:t.formItems}}';

const NEW_PROPS =
  'props:(()=>{const _auth=Array.isArray(t.authorizations)?t.authorizations:t.authorizations?[t.authorizations]:void 0;return{authorizations:_auth,schema:{authorizations:_auth,items:t.formItems}}})()';

const OLD_GET_AUTH =
  'const getAuthertications=e=>{const t=e?.fields?.[0]?.uiSchema?.fieldMetaEditor?.props?.schema?.authorizations;return t||null}';

const NEW_GET_AUTH =
  'const getAuthertications=e=>{const t=e?.fields?.[0]?.uiSchema?.fieldMetaEditor?.props?.authorizations??e?.fields?.[0]?.uiSchema?.fieldMetaEditor?.props?.schema?.authorizations;if(!t)return null;return Array.isArray(t)?t[0]:t}';

// dist-web 旧版：authorizations 在 schema 内且可能为对象
const OLD_WEB_MANIFEST =
  'props:{schema:{items:t.formItems,authorizations:t.authorizations}}';

const NEW_WEB_MANIFEST =
  'props:(()=>{const _auth=Array.isArray(t.authorizations)?t.authorizations:t.authorizations?[t.authorizations]:void 0;return{authorizations:_auth,schema:{authorizations:_auth,items:t.formItems}}})()';

const OLD_WEB_GET_AUTH =
  'export var getAuthertications=function(e){var t=e?.fields?.[0]?.uiSchema?.fieldMetaEditor?.props?.schema?.authorizations;return t||null}';

const NEW_WEB_GET_AUTH =
  'export var getAuthertications=function(e){var t=e?.fields?.[0]?.uiSchema?.fieldMetaEditor?.props?.authorizations??e?.fields?.[0]?.uiSchema?.fieldMetaEditor?.props?.schema?.authorizations;if(!t)return null;return Array.isArray(t)?t[0]:t}';

for (const rel of targets) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.warn('[patch] skip missing', rel);
    continue;
  }
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (code.includes(OLD_PROPS)) {
    code = code.replace(OLD_PROPS, NEW_PROPS);
    changed = true;
  }
  if (code.includes(OLD_WEB_MANIFEST)) {
    code = code.replace(OLD_WEB_MANIFEST, NEW_WEB_MANIFEST);
    changed = true;
  }
  if (code.includes(OLD_GET_AUTH)) {
    code = code.replace(OLD_GET_AUTH, NEW_GET_AUTH);
    changed = true;
  }
  if (code.includes(OLD_WEB_GET_AUTH)) {
    code = code.replace(OLD_WEB_GET_AUTH, NEW_WEB_GET_AUTH);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, code);
    console.log('[patch] updated', rel);
  } else if (code.includes('props:(()=>{const _auth=')) {
    console.log('[patch] already applied', rel);
  } else {
    console.warn('[patch] pattern not found in', rel);
  }
}
