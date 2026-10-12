import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl font-extrabold text-gradient-gold mb-4">404</div>
      <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
      <p className="text-gray-400 mb-8 max-w-md">
        Looks like this page rolled the wrong number. Let's get you back to the action.
      </p>
      <Link
        to="/"
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold inline-flex items-center gap-2 hover:scale-105 transition-transform duration-300"
      >
        <Home className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
}
