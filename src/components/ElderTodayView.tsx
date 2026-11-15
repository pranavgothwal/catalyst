import React, { useState } from 'react';
import { useCare } from '../context/CareContext';
import { DoseInstance, Appointment } from '../types';
import {
  CheckCircle2,
  Clock,
  Volume2,
  AlertCircle,
  HelpCircle,
  Calendar,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  Eye,
} from 'lucide-react';

export const ElderTodayView: React.FC = () => {
  const {
    currentProfile,
    doseInstances,
    appointments,
    recordDoseCheckIn,
    demoTime,
    members,
    profiles,
    language,
    setLanguage,
    accessReceipts,
  } = useCare();

  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [skipModalDose, setSkipModalDose] = useState<DoseInstance | null>(null);
  const [skipReason, setSkipReason] = useState<string>('Not feeling well / nausea');
  const [showAccessModal, setShowAccessModal] = useState(false);

  // Filter doses for today
  const todayStr = demoTime.toISOString().split('T')[0];
  const todayDoses = doseInstances.filter((d) => d.scheduledTime.startsWith(todayStr));

  // Speech synthesizer helper for accessibility
  const handleSpeak = (text: string, id: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      setSpeakingId(id);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`Read aloud: ${text}`);
    }
  };

  const translations = {
    en: {
      greeting: `Namaste, Sheela Ji`,
      sub: 'Here is your simple routine for today. No rush, take your time.',
      medSection: "Today's Medicines",
      aptSection: 'Upcoming Visits & Appointments',
      trustedContacts: 'Your Trusted Circle',
      accessTitle: 'Privacy & Information Access',
      accessDesc: 'You have full dignity and agency over who can see your health routine.',
      viewReceipts: 'View Recent Access Receipts',
      reportedTaken: 'Marked as Taken',
      takeNow: 'Take Medicine',
      cantTake: 'Cannot Take / Need Help',
      dueAt: 'Scheduled for',
    },
    hi: {
      greeting: `नमस्ते, शीला जी`,
      sub: 'आज की आपकी सरल दिनचर्या। कोई जल्दी नहीं है, आराम से करें।',
      medSection: 'आज की दवाइयां',
      aptSection: 'आने वाली नियुक्तियां',
      trustedContacts: 'आपका विश्वसनीय परिवार',
      accessTitle: 'गोपनीयता और डेटा नियंत्रण',
      accessDesc: 'आपके स्वास्थ्य डेटा पर केवल आपका अधिकार और नियंत्रण है।',
      viewReceipts: 'पहुंच रसीदें देखें',
      reportedTaken: 'ली जा चुकी है',
      takeNow: 'दवा लें',
      cantTake: 'नहीं ले सकते / सहायता चाहिए',
      dueAt: 'समय',
    },
    mr: {
      greeting: `नमस्कार, शीला ताई`,
      sub: 'आजची तुमची सोपी दिनचर्या. सावकाश आणि काळजीपूर्वक घ्या.',
      medSection: 'आजची औषधे',
      aptSection: 'पुढील भेटी आणि तपासण्या',
      trustedContacts: 'तुमचे काळजीवाहू कुटुंब',
      accessTitle: 'गोपनीयता आणि माहिती नियंत्रण',
      accessDesc: 'तुमच्या आरोग्याच्या माहितीवर तुमचा पूर्ण ताबा आणि अधिकार आहे.',
      viewReceipts: 'माहिती प्रवेश पाहा',
      reportedTaken: 'घेतले म्हणून नोंदवले',
      takeNow: 'औषध घ्या',
      cantTake: 'घेऊ शकत नाही / मदत हवी',
      dueAt: 'वेळ',
    },
  };

  const t = translations[language] || translations.en;

  const getDoseStatusBadge = (dose: DoseInstance) => {
    switch (dose.status) {
      case 'taken':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-sage-100 text-sage-700 border border-sage-300">
            <CheckCircle2 className="w-4 h-4 text-sage-600" />
            {t.reportedTaken}
          </span>
        );
      case 'unconfirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Check-in Overdue
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-terracotta-50 text-terracotta-600 border border-terracotta-200">
            Skipped: {dose.reason}
          </span>
        );
      case 'not_taken':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-200">
            Reported Not Taken
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-ivory-200 text-forest-900 border border-forest-800/10">
            <Clock className="w-4 h-4 text-forest-800/60" />
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* Warm, dignified header */}
      <div className="bg-gradient-to-r from-ivory-50 to-ivory-200 border-2 border-forest-900/10 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-forest-900 tracking-tight">
              {t.greeting}
            </h1>
            <button
              onClick={() => handleSpeak(`${t.greeting}. ${t.sub}`, 'greeting')}
              className="p-2.5 rounded-full bg-forest-900/5 hover:bg-forest-900/10 text-forest-900 transition-all"
              title="Read aloud"
              aria-label="Read greeting aloud"
            >
              <Volume2
                className={`w-5 h-5 ${speakingId === 'greeting' ? 'text-sage-600 animate-bounce' : ''}`}
              />
            </button>
          </div>
          <p className="text-lg text-forest-800/80 font-medium">{t.sub}</p>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1.5 bg-ivory-300/60 p-1.5 rounded-2xl border border-forest-900/10 self-start sm:self-auto">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              language === 'en'
                ? 'bg-forest-900 text-ivory-100 shadow'
                : 'text-forest-800 hover:text-forest-950'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              language === 'hi'
                ? 'bg-forest-900 text-ivory-100 shadow'
                : 'text-forest-800 hover:text-forest-950'
            }`}
          >
            हिंदी
          </button>
          <button
            onClick={() => setLanguage('mr')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              language === 'mr'
                ? 'bg-forest-900 text-ivory-100 shadow'
                : 'text-forest-800 hover:text-forest-950'
            }`}
          >
            मराठी
          </button>
        </div>
      </div>

      {/* Large readable medication cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-forest-900 tracking-tight flex items-center gap-2">
            <span>{t.medSection}</span>
            <span className="text-sm font-semibold bg-sage-200 text-sage-700 px-3 py-0.5 rounded-full">
              {todayDoses.length} scheduled
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {todayDoses.map((dose) => {
            const timeFormatted = new Date(dose.scheduledTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const isTaken = dose.status === 'taken';

            return (
              <div
                key={dose.id}
                className={`p-6 rounded-3xl border-2 transition-all ${
                  isTaken
                    ? 'bg-ivory-50/70 border-sage-200 opacity-90'
                    : dose.status === 'unconfirmed'
                    ? 'bg-amber-50/50 border-amber-300 shadow-md ring-2 ring-amber-400/30'
                    : 'bg-ivory-50 border-forest-900/10 hover:border-forest-900/20 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-forest-800/70 bg-ivory-200 px-3 py-1 rounded-xl">
                        {t.dueAt} {timeFormatted}
                      </span>
                      {getDoseStatusBadge(dose)}
                    </div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-extrabold text-forest-900">
                        {dose.medicationName}
                      </h3>
                      <button
                        onClick={() =>
                          handleSpeak(
                            `${dose.medicationName}. ${dose.dosage}. ${dose.instructions}`,
                            dose.id
                          )
                        }
                        className="p-1.5 rounded-full hover:bg-forest-900/10 text-forest-800"
                        title="Read instructions aloud"
                        aria-label={`Read ${dose.medicationName} aloud`}
                      >
                        <Volume2
                          className={`w-5 h-5 ${
                            speakingId === dose.id ? 'text-sage-600 animate-bounce' : ''
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-base font-bold text-forest-800">{dose.dosage}</p>
                    <p className="text-sm text-forest-800/80 leading-relaxed max-w-xl">
                      {dose.instructions}
                    </p>
                  </div>

                  {/* Actions for Elder */}
                  <div className="flex flex-row sm:flex-col gap-2.5 sm:min-w-[190px]">
                    {!isTaken ? (
                      <>
                        <button
                          onClick={() => recordDoseCheckIn(dose.id, 'taken')}
                          className="flex-1 sm:flex-none bg-forest-900 hover:bg-forest-950 text-ivory-100 font-extrabold text-base py-3.5 px-5 rounded-2xl shadow transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <CheckCircle2 className="w-5 h-5 text-sage-200" />
                          <span>{t.takeNow}</span>
                        </button>
                        <button
                          onClick={() => setSkipModalDose(dose)}
                          className="flex-1 sm:flex-none bg-ivory-200 hover:bg-ivory-300 text-forest-900 font-bold text-sm py-2.5 px-4 rounded-xl border border-forest-900/10 transition-all flex items-center justify-center gap-1.5"
                        >
                          <HelpCircle className="w-4 h-4 text-forest-800" />
                          <span>{t.cantTake}</span>
                        </button>
                      </>
                    ) : (
                      <div className="bg-sage-100/80 border border-sage-300 p-3 rounded-2xl text-center">
                        <span className="text-xs font-bold text-sage-800 block">
                          Recorded at{' '}
                          {dose.checkInTime
                            ? new Date(dose.checkInTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                        <span className="text-[11px] text-sage-700 italic block mt-0.5">
                          {dose.provenance === 'self_reported'
                            ? 'Self-reported by you'
                            : 'Confirmed by caregiver'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Clear upcoming appointments */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-forest-900 tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-sage-600" />
          <span>{t.aptSection}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-ivory-50 border-2 border-forest-900/10 rounded-3xl p-5 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold bg-sage-200 text-sage-700 px-3 py-1 rounded-xl">
                  {new Date(apt.scheduledTime).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="text-xs text-forest-800/70 font-semibold">{apt.specialty}</span>
              </div>
              <h3 className="text-lg font-extrabold text-forest-900">{apt.title}</h3>
              <p className="text-sm text-forest-800/80">{apt.location}</p>
              {apt.accompaniedBy && (
                <p className="text-xs font-semibold text-sage-700 bg-sage-50 p-2 rounded-xl border border-sage-200">
                  Accompanied by: {apt.accompaniedBy}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Trusted contacts & Dignity Privacy Controls */}
      <section className="bg-forest-900 text-ivory-100 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-black flex items-center gap-2 text-ivory-100">
              <ShieldCheck className="w-5 h-5 text-sage-200" />
              {t.accessTitle}
            </h2>
            <p className="text-xs text-sage-200 max-w-xl">{t.accessDesc}</p>
          </div>
          <button
            onClick={() => setShowAccessModal(true)}
            className="bg-forest-800 hover:bg-forest-950 border border-sage-500/30 text-ivory-100 font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-sage-200" />
            {t.viewReceipts} ({accessReceipts.length})
          </button>
        </div>

        <div className="border-t border-forest-800 pt-5">
          <h3 className="text-sm font-bold text-sage-200 uppercase tracking-wider mb-3">
            {t.trustedContacts}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {profiles
              .filter((p) => p.role !== 'elder')
              .map((contact) => (
                <div
                  key={contact.id}
                  className="bg-forest-800/60 p-3.5 rounded-2xl border border-forest-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={contact.avatar}
                      alt={contact.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-ivory-100/20"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-ivory-100">{contact.fullName}</h4>
                      <p className="text-xs text-sage-200 capitalize">{contact.role}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${contact.phone}`}
                    className="p-2 rounded-xl bg-forest-900 hover:bg-forest-950 text-sage-200 border border-forest-800"
                    title="Call contact"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Skip / Need Help Modal */}
      {skipModalDose && (
        <div className="fixed inset-0 z-50 bg-forest-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ivory-100 border-2 border-forest-900/20 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-xl font-black text-forest-900">
              Need Help or Cannot Take Medicine?
            </h3>
            <p className="text-sm text-forest-800">
              Select what best describes your situation for{' '}
              <strong>{skipModalDose.medicationName}</strong>. Your family will be gently notified.
            </p>

            <div className="space-y-2">
              {[
                'Not feeling well / nausea',
                'Pill finished / needs refill',
                'Doctor advised to pause',
                'Need family help first',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    skipReason === reason
                      ? 'bg-sage-100 border-sage-500 font-bold'
                      : 'bg-ivory-50 border-forest-900/10'
                  }`}
                >
                  <input
                    type="radio"
                    name="skipReason"
                    value={reason}
                    checked={skipReason === reason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    className="accent-sage-600"
                  />
                  <span className="text-sm text-forest-900">{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSkipModalDose(null)}
                className="flex-1 py-3 bg-ivory-200 hover:bg-ivory-300 text-forest-900 font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  recordDoseCheckIn(skipModalDose.id, 'skipped', skipReason);
                  setSkipModalDose(null);
                }}
                className="flex-1 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-ivory-100 font-bold rounded-xl text-sm"
              >
                Confirm Reason
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Receipts Modal */}
      {showAccessModal && (
        <div className="fixed inset-0 z-50 bg-forest-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ivory-100 border-2 border-forest-900/20 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-forest-900/10">
              <h3 className="text-xl font-black text-forest-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sage-600" />
                Access Receipts
              </h3>
              <button
                onClick={() => setShowAccessModal(false)}
                className="text-xs font-bold text-forest-800 hover:underline"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-forest-800">
              Audit log of authorized family members and caregivers who accessed your health routine.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {accessReceipts.length === 0 ? (
                <div className="text-center py-8 text-sm text-forest-800/60 font-medium">
                  No external accesses recorded yet today.
                </div>
              ) : (
                accessReceipts.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-ivory-50 rounded-2xl border border-forest-900/10 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-forest-900">
                      <span>{rec.accessorName}</span>
                      <span className="text-[10px] text-forest-800/60 font-normal">
                        {new Date(rec.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-forest-800/80 flex items-center gap-1.5">
                      <span className="capitalize bg-sage-200 text-sage-800 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                        {rec.accessorRole}
                      </span>
                      <span>viewed {rec.categoryAccessed} category</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
