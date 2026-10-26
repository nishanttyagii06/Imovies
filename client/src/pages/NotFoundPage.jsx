import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Home, Compass } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-brand-600/20 text-brand-500 border border-brand-500/30 flex items-center justify-center mx-auto shadow-2xl">
          <Film className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-white tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-slate-200">Scene Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page you're searching for seems to have ended on the cutting room floor. Let's get you back to the movies!
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
          <Link
            to="/movies"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
