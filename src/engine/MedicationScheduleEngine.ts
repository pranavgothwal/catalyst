import { DoseInstance, Medication } from '../types';

export class MedicationScheduleEngine {
  /**
   * Idempotently generates dose instances for a given date from active medications.
   * Prevents duplicate dose instances for the same schedule slot.
   */
  static generateDailyDoseInstances(
    medications: Medication[],
    existingInstances: DoseInstance[],
    date: Date,
    circleId: string
  ): DoseInstance[] {
    const newInstances: DoseInstance[] = [];
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

    for (const med of medications) {
      if (!med.active) continue;

      for (const timeStr of med.scheduleTimes) {
        // e.g. timeStr is "08:00"
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduledDate = new Date(date);
        scheduledDate.setHours(hours, minutes, 0, 0);
        const scheduledIso = scheduledDate.toISOString();

        // Check if instance already exists
        const exists = existingInstances.some(
          (inst) =>
            inst.medicationId === med.id &&
            inst.scheduledTime.startsWith(dateStr) &&
            new Date(inst.scheduledTime).getHours() === hours &&
            new Date(inst.scheduledTime).getMinutes() === minutes
        );

        if (!exists) {
          newInstances.push({
            id: `dose-${med.id}-${dateStr}-${timeStr.replace(':', '')}`,
            medicationId: med.id,
            medicationName: med.name,
            dosage: med.dosage,
            instructions: med.instructions,
            circleId,
            scheduledTime: scheduledIso,
            status: 'due',
            provenance: 'system',
          });
        }
      }
    }

    return newInstances;
  }

  /**
   * Evaluates dose instances against current time:
   * If a dose is past scheduledTime + gracePeriod and status is 'due', mark it 'unconfirmed'
   * and optionally signal care loop generation.
   */
  static evaluateDoseStatus(
    dose: DoseInstance,
    currentTime: Date,
    graceMinutes = 45
  ): { updated: boolean; dose: DoseInstance; triggerLoop: boolean } {
    if (dose.status !== 'due') {
      return { updated: false, dose, triggerLoop: false };
    }

    const scheduledMs = new Date(dose.scheduledTime).getTime();
    const currentMs = currentTime.getTime();
    const graceMs = graceMinutes * 60 * 1000;

    if (currentMs > scheduledMs + graceMs) {
      const updatedDose: DoseInstance = {
        ...dose,
        status: 'unconfirmed',
      };
      return { updated: true, dose: updatedDose, triggerLoop: !dose.careLoopId };
    }

    return { updated: false, dose, triggerLoop: false };
  }
}
