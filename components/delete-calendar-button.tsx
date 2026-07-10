"use client";

import { useRef, useState } from "react";
import { deleteFamilyCalendar } from "@/app/actions";

export function DeleteCalendarButton({ calendarId, title }: { calendarId: string; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <button
        type="button"
        className="motion-soft text-sm font-bold text-red-700 hover:text-red-900"
        onClick={() => dialogRef.current?.showModal()}
      >
        Delete calendar
      </button>

      <dialog ref={dialogRef} className="w-[min(92vw,28rem)] rounded-[1.5rem] p-0 shadow-card backdrop:bg-ink/55">
        <form
          action={deleteFamilyCalendar}
          className={`rounded-[1.5rem] bg-white p-6 text-ink transition-opacity duration-150 ${isDeleting ? "opacity-60" : ""}`}
          onSubmit={() => {
            setIsDeleting(true);
            dialogRef.current?.close();
          }}
        >
          <input type="hidden" name="calendar_id" value={calendarId} />
          <input type="hidden" name="confirm_delete" value="on" />
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">Confirm delete</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">Delete this calendar?</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            This will permanently delete <span className="font-bold text-ink">{title}</span> and all of its activities.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button className="motion-soft rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm" type="button" onClick={() => dialogRef.current?.close()} disabled={isDeleting}>
              Cancel
            </button>
            <button
              className="motion-soft rounded-full bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, delete it"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
