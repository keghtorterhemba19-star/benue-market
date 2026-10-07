import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CategoryInfo } from '../../types';
import { ArrowRight } from 'lucide-react';

interface CategoryCardProps {
  category: CategoryInfo;
}

const FALLBACK_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=600';

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const [hasError, setHasError] = useState(false);
  const imgSrc = hasError ? FALLBACK_CATEGORY_IMAGE : (category.imageUrl || FALLBACK_CATEGORY_IMAGE);

  return (
    <Link
      to={`/browse?category=${category.id}`}
      className="group bg-white rounded-xl border border-[#E8E2D9] overflow-hidden flex flex-col justify-between hover:border-[#9CA3AF] hover:shadow-md transition-all duration-200"
    >
      {/* Category Food Products Picture Header */}
      <div className="relative aspect-[16/9] w-full bg-[#F4EFEB] overflow-hidden">
        <img
          src={imgSrc}
          alt={category.name}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Scrim Gradient for WCAG Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

        {/* Badge Overlay */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-bold text-[#0F5132] border border-[#E8E2D9] shadow-xs">
          Benue Harvest
        </div>

        {/* Category Name overlay on image */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-extrabold text-lg drop-shadow-xs group-hover:text-[#FEF3C7] transition-colors">
            {category.name}
          </h3>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
        <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">
          {category.description}
        </p>

        {/* Popular items chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {category.popularItems.map((item, idx) => (
            <span
              key={idx}
              className="text-xs bg-[#E8F5E9] text-[#0F5132] px-2 py-0.5 rounded font-semibold border border-[#C8E6C9]"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-[#E8E2D9] flex items-center justify-between text-xs font-bold text-[#0F5132]">
          <span>Browse {category.name}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};
