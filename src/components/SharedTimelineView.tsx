import React from 'react';
import { useCare } from '../context/CareContext';
import { TimelineEvent } from '../types';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Calendar,
  Pill,
  UserCheck,
} from 'lucide-react';

export const SharedTimelineView: React.FC = () => {
  const { timeline } = useCare();

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.eventType) {
      case 'medication':
        return <Pill className="w-4 h-4 text-sage-600" />;
      case 'care_loop':
        return event.severity === 'urgent' ? (
          <AlertTriangle className="w-4 h-4 text-red-600" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        );
      case 'handover':
        return <ClipboardCheck className="w-4 h-4 text-sage-600" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-forest-800" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-forest-800" />;
    }
  };

  const getBadgeStyle = (severity?: TimelineEvent['severity']) => {
    switch (severity) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'success':
        return 'bg-sage-100 text-sage-800 border-sage-300';
      default:
        return 'bg-ivory-200 text-forest-900 border-forest-900/10';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-forest-900/10 pb-4">
        <div>
          <h2 className="text-2xl font-black text-forest-900 flex items-center gap-2">
            <History className="w-6 h-6 text-sage-600" />
            Shared Care Timeline
          </h2>
          <p className="text-xs text-forest-800/80 mt-1">
            Immutable audit record of all care events, check-ins, loop claims, handovers, and
            provenance.
          </p>
        </div>
        <span className="text-xs font-bold text-forest-800 bg-ivory-200 px-3 py-1 rounded-full border border-forest-900/10">
          {timeline.length} Entries
        </span>
      </div>

      <div className="relative pl-6 border-l-2 border-forest-900/15 space-y-6">
        {timeline.map((event) => (
          <div key={event.id} className="relative group">
            {/* Timeline bullet dot */}
            <div className="absolute -left-[31px] top-1.5 w-6 h-6 rounded-full bg-ivory-100 border-2 border-forest-900/30 flex items-center justify-center">
              {getEventIcon(event)}
            </div>

            <div className="bg-ivory-50 border-2 border-forest-900/10 rounded-2xl p-4.5 space-y-1.5 hover:border-forest-900/20 transition-all shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="font-extrabold text-forest-900 text-sm">{event.title}</span>
                <span className="text-[11px] text-forest-800/60 font-semibold">
                  {new Date(event.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>

              <p className="text-xs text-forest-800 leading-relaxed">{event.description}</p>

              <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px]">
                {event.actorName && (
                  <span className="bg-ivory-200 text-forest-900 font-bold px-2 py-0.5 rounded-lg border border-forest-900/10 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-sage-600" />
                    {event.actorName} {event.actorRole ? `(${event.actorRole})` : ''}
                  </span>
                )}
                {event.provenance && (
                  <span className="text-forest-800/70 italic bg-forest-900/5 px-2 py-0.5 rounded-lg">
                    Provenance: {event.provenance}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-lg font-bold border uppercase tracking-wider ${getBadgeStyle(
                    event.severity
                  )}`}
                >
                  {event.severity || 'info'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
