import React from 'react';

export const MovieCardSkeleton = () => (
  <div className="rounded-2xl bg-cinema-card border border-cinema-border p-3 animate-pulse flex flex-col gap-3">
    <div className="aspect-[2/3] w-full bg-slate-800 rounded-xl" />
    <div className="h-4 bg-slate-800 rounded w-3/4" />
    <div className="h-3 bg-slate-800 rounded w-1/2" />
    <div className="h-9 bg-slate-800 rounded-xl w-full mt-2" />
  </div>
);

export const ShowtimeSkeleton = () => (
  <div className="p-5 rounded-2xl bg-cinema-card border border-cinema-border animate-pulse space-y-4">
    <div className="flex justify-between items-center">
      <div className="h-5 bg-slate-800 rounded w-1/3" />
      <div className="h-4 bg-slate-800 rounded w-1/6" />
    </div>
    <div className="flex gap-3">
      <div className="h-9 w-24 bg-slate-800 rounded-xl" />
      <div className="h-9 w-24 bg-slate-800 rounded-xl" />
      <div className="h-9 w-24 bg-slate-800 rounded-xl" />
    </div>
  </div>
);
