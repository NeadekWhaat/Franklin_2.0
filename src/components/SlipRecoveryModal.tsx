import React, { useState } from 'react';
import { useFranklin } from '../context/FranklinContext';
import { RECOVERY_RULES } from '../config/franklinDefaults';
import { X, ShieldCheck, HeartHandshake, CheckCircle2 } from 'lucide-react';

interface SlipRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SlipRecoveryModal: React.FC<SlipRecoveryModalProps> = ({ isOpen, onClose }) => {
  const { logSlipRecovery, language, t } = useFranklin();
  const isRu = language === 'ru';

  const [trigger, setTrigger] = useState('');
  const [rootCause, setRootCause] = useState<
    'fatigue' | 'novelty_seeking' | 'perfectionism' | 'over_planning' | 'unclear_first_step' | 'external'
  >('fatigue');
  const [customMicro, setCustomMicro] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  if (!isOpen) return null;

  const ROOT_CAUSES = [
    {
      id: 'fatigue',
      label: isRu ? 'Истощение / Недосып' : 'Exhaustion / Sleep Deprivation',
      desc: isRu
        ? 'Физический ресурс исчерпан. Самоконтроль отключился из-за дефицита сна или отдыха.'
        : 'Energy was drained; self-control collapsed due to physical deficit.',
      suggestedRule: RECOVERY_RULES[1],
      micro: isRu
        ? 'Выпить стакан воды, умыться и сделать 5 минут лёгкой растяжки или прогулки.'
        : 'Drink water, wash face, and do a 5-minute easy walk or stretch.',
    },
    {
      id: 'novelty_seeking',
      label: isRu ? 'Спад новизны / Скука' : 'Novelty Wore Off / Boredom',
      desc: isRu
        ? 'Первый энтузиазм угас. Задача показалась рутинной, мозг потребовал лёгкого дофамина.'
        : 'Initial hype faded; routine felt unexciting and brain craved quick dopamine.',
      suggestedRule: RECOVERY_RULES[4],
      micro: isRu
        ? 'Признать: мастерство начинается там, где кончается новизна. Поработать 10 минут.'
        : 'Acknowledge that boredom precedes mastery. Work for just 10 minutes.',
    },
    {
      id: 'dopamine_trap',
      label: isRu ? 'Ловушка YouTube / Игр / Соцсетей' : 'Fell into YouTube / Games / Feeds',
      desc: isRu
        ? 'Автоматический уход в простые удовольствия вместо начала неприятного дела.'
        : 'Avoided an unpleasant task by escaping to frictionless screens.',
      suggestedRule: RECOVERY_RULES[2],
      micro: isRu
        ? 'Немедленно закрыть вкладки развлечений. Ноль самобичевания. Сделать 10 минут работы.'
        : 'Close all entertainment tabs immediately. Zero self-blame. Start the next 10-minute task.',
    },
    {
      id: 'over_planning',
      label: isRu ? 'Перфекционизм и перепланирование' : 'Over-Planning / Perfectionism',
      desc: isRu
        ? 'Слишком высокая планка вызвала тревогу; страх сделать неидеально заблокировал старт.'
        : 'High expectations created anxiety; fear of doing it imperfectly stopped action.',
      suggestedRule: RECOVERY_RULES[0],
      micro: isRu
        ? 'Сделать черновой, неидеальный вариант задачи за 10 минут.'
        : 'Execute a messy, rough draft version of the task in 10 minutes.',
    },
    {
      id: 'unclear_first_step',
      label: isRu ? 'Непонятно, с чего начать' : 'Unclear First Action',
      desc: isRu
        ? 'Задача сформулирована слишком абстрактно; мозг сопротивляется неизвестности.'
        : 'Goal lacks concrete action; brain hesitates facing ambiguity.',
      suggestedRule: RECOVERY_RULES[3],
      micro: isRu
        ? 'Открыть блокнот и сформулировать одно 2-минутное действие глаголом.'
        : 'Write down a single 2-minute actionable physical step.',
    },
    {
      id: 'external',
      label: isRu ? 'Внешний форс-мажор / Срыв планов' : 'External Emergency / Interruption',
      desc: isRu
        ? 'Обстоятельства разрушили расписание. Задача — не пытаться наверстать всё ночью.'
        : 'Unforeseen events interrupted the day. Priority is staying composed.',
      suggestedRule: RECOVERY_RULES[1],
      micro: isRu
        ? 'Переключить день в Жёлтый режим и выполнить только 1 главную задачу.'
        : 'Switch to Yellow Day mode and protect only the anchor task.',
    },
  ];

  const currentCauseConfig = ROOT_CAUSES.find((c) => c.id === rootCause) || ROOT_CAUSES[0];

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    logSlipRecovery({
      date: new Date().toISOString().split('T')[0],
      trigger: trigger.trim() || (isRu ? 'Внезапная потеря концентрации' : 'Sudden loss of focus'),
      rootCause,
      selectedMicroAction: customMicro.trim() || currentCauseConfig.micro,
      recoveryRuleApplied: currentCauseConfig.suggestedRule.titleRu,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0e1118] border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 text-slate-900 dark:text-neutral-100 shadow-2xl overflow-y-auto max-h-[90vh] transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors p-1 rounded-lg"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono font-bold mb-1">
            <HeartHandshake size={14} />
            <span>{t('slipModalKicker')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('slipModalTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-1 leading-relaxed">
            {t('slipModalDesc')}
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2 font-mono">
                {t('slipStep1Question')}
              </label>
              <div className="space-y-2">
                {ROOT_CAUSES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setRootCause(c.id as any)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all ${
                      rootCause === c.id
                        ? 'bg-slate-900 dark:bg-[#182033] border-slate-900 dark:border-white/30 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-[#141824] border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-bold">{c.label}</div>
                    <div className={`text-xs mt-0.5 leading-relaxed ${rootCause === c.id ? 'text-slate-300' : 'text-slate-500 dark:text-neutral-400'}`}>{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                {t('slipStep1PrevActivity')}
              </label>
              <input
                type="text"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder={t('slipStep1PrevActivityPlh')}
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 transition-colors shadow-xs"
              >
                {t('nextRuleBtn')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFinish} className="space-y-5">
            <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-[#141c2c] border border-blue-200 dark:border-blue-900/40 text-slate-800 dark:text-neutral-200 text-xs sm:text-sm space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300">
                <ShieldCheck size={16} />
                <span>{t('governingRule')}</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {isRu ? currentCauseConfig.suggestedRule.titleRu : currentCauseConfig.suggestedRule.title}
              </div>
              <div className="text-slate-600 dark:text-neutral-400 text-xs leading-relaxed">
                {isRu ? currentCauseConfig.suggestedRule.descRu : currentCauseConfig.suggestedRule.desc}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2 font-mono">
                {t('chooseMicroAction')}
              </label>
              <div className="p-3.5 bg-slate-50 dark:bg-[#141824] border border-slate-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-neutral-300 mb-2">
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 uppercase font-mono font-bold mb-1">{t('recommendedMicro')}</div>
                <div className="text-slate-900 dark:text-white font-medium">{currentCauseConfig.micro}</div>
              </div>

              <input
                type="text"
                value={customMicro}
                onChange={(e) => setCustomMicro(e.target.value)}
                placeholder={t('customMicroPlh')}
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5 font-mono">
                {t('noteToSelf')}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('noteToSelfPlh')}
                className="w-full bg-slate-50 dark:bg-[#141824] border border-slate-300 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {t('backBtn')}
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs"
              >
                <CheckCircle2 size={16} />
                <span>{t('logRecoveryBtn')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
