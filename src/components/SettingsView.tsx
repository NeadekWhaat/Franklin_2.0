import React, { useState } from 'react';
import { useFranklin } from '../context/FranklinContext';
import {
  Download,
  Upload,
  RotateCcw,
  Cloud,
  Check,
  AlertCircle,
  Languages,
  Code,
  Sun,
  Moon,
  Edit3,
  Type,
} from 'lucide-react';
import { GoogleWorkspaceHub } from './GoogleWorkspaceHub';

export const SettingsView: React.FC = () => {
  const {
    state,
    exportStateJson,
    importStateJson,
    resetToDefaults,
    toggleCloudSync,
    syncNowWithCloud,
    isCloudSyncing,
    cloudSyncStatus,
    language,
    setLanguage,
    theme,
    toggleTheme,
    t,
    isEditMode,
    toggleEditMode,
    customTexts,
    clearAllCustomTexts,
    fontScale,
    setFontScale,
  } = useFranklin();

  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleTextImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    const res = importStateJson(importText.trim());
    if (res.success) {
      setImportStatus({
        success: true,
        message: language === 'ru' ? 'Конфигурация успешно восстановлена!' : 'Configuration successfully restored!',
      });
      setImportText('');
    } else {
      setImportStatus({
        success: false,
        message: res.error || (language === 'ru' ? 'Ошибка обработки JSON: некорректная структура' : 'Failed to parse JSON'),
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importStateJson(content);
        if (res.success) {
          setImportStatus({
            success: true,
            message: language === 'ru' ? `Успешно загружено из ${file.name}` : `Imported successfully from ${file.name}`,
          });
        } else {
          setImportStatus({
            success: false,
            message: res.error || (language === 'ru' ? 'Файл повреждён или некорректен' : 'File corrupted or invalid'),
          });
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-5 sm:p-7 shadow-xs">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400">
          {language === 'ru'
            ? 'Параметры системы · Резервное копирование, тема и язык'
            : 'System Settings · Backup, Theme & Language'}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          {t('settingsTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
          {t('settingsIntro')}
        </p>
      </div>

      {/* Theme & Language Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Switcher Section */}
        <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
            <Languages size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span>{t('languageSectionTitle')}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-neutral-400">
            {t('languageSectionDesc')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setLanguage('ru')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                language === 'ru'
                  ? 'bg-slate-900 dark:bg-neutral-800 border-slate-900 dark:border-neutral-700 text-white shadow-xs font-semibold'
                  : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇷🇺 {t('langRu')}</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                language === 'en'
                  ? 'bg-slate-900 dark:bg-neutral-800 border-slate-900 dark:border-neutral-700 text-white shadow-xs font-semibold'
                  : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇬🇧 {t('langEn')}</span>
            </button>
          </div>
        </div>

        {/* Theme Section */}
        <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
            {theme === 'dark' ? <Moon size={18} className="text-amber-400" /> : <Sun size={18} className="text-amber-500" />}
            <span>{language === 'ru' ? 'Тема оформления' : 'Visual Theme'}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-neutral-400">
            {language === 'ru'
              ? 'Выберите чистый современный светлый интерфейс или сосредоточенную тёмную тему.'
              : 'Switch between the modern crisp light interface and deep dark focus mode.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                theme === 'light'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                  : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900'
              }`}
            >
              <Sun size={15} />
              <span>{language === 'ru' ? 'Светлая тема' : 'Light Theme'}</span>
            </button>
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-neutral-800 border-neutral-700 text-white shadow-xs font-semibold'
                  : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-white'
              }`}
            >
              <Moon size={15} />
              <span>{language === 'ru' ? 'Тёмная тема' : 'Dark Theme'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Typography & Font Scaling Section */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
            <Type size={18} className="text-cyan-600 dark:text-cyan-400" />
            <span>{language === 'ru' ? 'Шрифт и масштабирование для чтения' : 'Typography & Font Scale'}</span>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
            {fontScale === 'standard' ? '100% (Стандарт)' : fontScale === 'comfortable' ? '110% (Комфортный)' : '125% (Крупный)'}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
          {language === 'ru'
            ? 'Приложение использует современный читабельный шрифт Inter с оптимизированной кириллицей. Выберите удобный для ваших глаз размер текста на ПК и смартфоне.'
            : 'The app uses modern, legible Inter typography with high-DPI font smoothing. Choose the most comfortable font scale for your eyes.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setFontScale('standard')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              fontScale === 'standard'
                ? 'bg-slate-900 text-white dark:bg-neutral-800 border-slate-900 dark:border-neutral-700 shadow-xs'
                : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300'
            }`}
          >
            <div className="text-xs font-bold">100% · {language === 'ru' ? 'Обычный' : 'Standard'}</div>
            <div className="text-[11px] opacity-70 mt-1">{language === 'ru' ? 'Компактная плотность' : 'Compact density'}</div>
          </button>

          <button
            type="button"
            onClick={() => setFontScale('comfortable')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              fontScale === 'comfortable'
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300'
            }`}
          >
            <div className="text-xs font-bold">110% · {language === 'ru' ? 'Комфортный' : 'Comfortable'}</div>
            <div className="text-[11px] opacity-70 mt-1">{language === 'ru' ? 'Оптимально для телефонов' : 'Recommended for phones'}</div>
          </button>

          <button
            type="button"
            onClick={() => setFontScale('large')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              fontScale === 'large'
                ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300'
            }`}
          >
            <div className="text-xs font-bold">125% · {language === 'ru' ? 'Крупный' : 'Large'}</div>
            <div className="text-[11px] opacity-70 mt-1">{language === 'ru' ? 'Максимальная чёткость' : 'Maximum legibility'}</div>
          </button>
        </div>
      </div>

      {/* Google Workspace Hub Section */}
      <GoogleWorkspaceHub defaultTab="calendar" isCompact={false} />

      {/* Developer Visual Text Editor Section */}
      <div className="bg-white dark:bg-[#0e1118] border border-amber-200/90 dark:border-amber-500/30 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-semibold">
            <Edit3 size={18} className="text-amber-500" />
            <span>
              {language === 'ru'
                ? 'Режим разработчика · Визуальный редактор текста'
                : 'Developer Mode · Visual Text Editor'}
            </span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              {language === 'ru'
                ? `Изменено фраз: ${Object.keys(customTexts).length}`
                : `Edited strings: ${Object.keys(customTexts).length}`}
            </span>
          </div>

          <div className="flex items-center gap-2" data-dev-editor-ignore="true">
            {Object.keys(customTexts).length > 0 && (
              <button
                type="button"
                onClick={clearAllCustomTexts}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
              >
                <RotateCcw size={13} />
                <span>{language === 'ru' ? 'Сбросить все правки текста' : 'Reset all text edits'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={toggleEditMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isEditMode
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
              }`}
            >
              <Edit3 size={14} />
              <span>
                {isEditMode
                  ? language === 'ru'
                    ? 'Выключить режим редактора'
                    : 'Disable Editor Mode'
                  : language === 'ru'
                  ? 'Включить режим редактора'
                  : 'Enable Editor Mode'}
              </span>
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
          {language === 'ru'
            ? 'Позволяет кликнуть на любой заголовок, кнопку, правило или карточку в приложении и изменить её текст без риска сломать вёрстку или логику. Все правки сохраняются поверх заводских текстов и входят в JSON-бэкап.'
            : 'Click any heading, button, rule, or card in the app to customize its text safely without breaking layout or application logic.'}
        </p>
      </div>

      {/* 1-Click Backup & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold mb-2">
              <Download size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t('exportTitle')}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              {t('exportDesc')}
            </p>
          </div>

          <button
            onClick={exportStateJson}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-semibold text-xs sm:text-sm transition-colors shadow-xs"
          >
            <Download size={15} />
            <span>{t('exportBtn')}</span>
          </button>
        </div>

        {/* File Import Card */}
        <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold mb-2">
              <Upload size={16} className="text-blue-600 dark:text-blue-400" />
              <span>{t('importTitle')}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              {t('importDesc')}
            </p>
          </div>

          <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#141824] dark:hover:bg-[#1a2030] border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-white font-semibold text-xs sm:text-sm cursor-pointer transition-colors shadow-xs">
            <Upload size={15} />
            <span>{t('importSelectBtn')}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Status banner */}
      {importStatus && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            importStatus.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {importStatus.success ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Cloud Sync Adapter Option */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cloud size={16} className="text-cyan-600 dark:text-cyan-400" />
              <span>{t('cloudSyncTitle')}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  cloudSyncStatus === 'synced'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : cloudSyncStatus === 'syncing'
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                    : 'bg-slate-100 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400'
                }`}
              >
                {cloudSyncStatus === 'synced'
                  ? language === 'ru'
                    ? 'Синхронизировано (ПК ↔ Телефон)'
                    : 'Synced (PC ↔ Mobile)'
                  : cloudSyncStatus === 'syncing'
                  ? language === 'ru'
                    ? 'Синхронизация...'
                    : 'Syncing...'
                  : language === 'ru'
                  ? 'Локальный режим'
                  : 'Local mode'}
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-neutral-400 mt-0.5">
              {language === 'ru'
                ? 'Автоматически объединяет задачи дня, привычки, цели и чат между вашим компьютером и смартфоном, а также восстанавливает задачи из Google Календаря и Google Tasks.'
                : t('cloudSyncDesc')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => syncNowWithCloud()}
              disabled={isCloudSyncing}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 transition-colors disabled:opacity-50"
            >
              {isCloudSyncing
                ? language === 'ru'
                  ? 'Обмен данными...'
                  : 'Syncing...'
                : language === 'ru'
                ? 'Синхронизировать сейчас'
                : 'Sync Now'}
            </button>

            <button
              type="button"
              onClick={() => toggleCloudSync(!state.settings.cloudSyncEnabled)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                state.settings.cloudSyncEnabled
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
              }`}
            >
              {state.settings.cloudSyncEnabled ? t('cloudSyncOn') : t('cloudSyncOff')}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-neutral-400 font-mono">
          <div>
            {language === 'ru' ? 'Статус: ' : 'Status: '}
            {state.settings.cloudSyncEnabled ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {t('cloudSyncActiveDesc')}
              </span>
            ) : (
              <span className="text-slate-500 dark:text-neutral-500">
                {t('cloudSyncLocalDesc')}
              </span>
            )}
          </div>
          {state.settings.lastSyncedAt && (
            <div className="text-[11px] text-slate-400 dark:text-neutral-500">
              {language === 'ru' ? 'Последняя синхронизация: ' : 'Last synced: '}
              {new Date(state.settings.lastSyncedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          )}
        </div>
      </div>

      {/* Paste JSON manually */}
      <div className="bg-white dark:bg-[#0e1118] border border-slate-200/90 dark:border-neutral-800/80 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Code size={16} className="text-indigo-600 dark:text-purple-400" />
          <span>{t('jsonDirectTitle')}</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-neutral-400">
          {t('jsonDirectDesc')}
        </p>
        <form onSubmit={handleTextImport} className="space-y-3">
          <textarea
            rows={4}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"version": 2, "personality": {...}}'
            className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 dark:hover:bg-neutral-700 text-white text-xs font-medium rounded-xl transition-colors shadow-xs"
          >
            {t('jsonParseBtn')}
          </button>
        </form>
      </div>

      {/* Reset to Default Franklin Blueprint */}
      <div className="bg-white dark:bg-[#0e1118] border border-rose-200 dark:border-rose-950/40 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-sm">
          <RotateCcw size={15} />
          <span>{t('resetTitle')}</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
          {t('resetDesc')}
        </p>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-xl transition-colors"
          >
            {t('resetBtn')}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetToDefaults();
                setShowResetConfirm(false);
              }}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-500 transition-colors shadow-xs"
            >
              {t('confirmResetBtn')}
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white text-xs font-medium transition-colors"
            >
              {t('cancelBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
