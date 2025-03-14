import React, { useState, useEffect, useRef } from 'react';
import './CompanionCat.css';

// Импортируем анимации медведей
import heIdle1 from '../assets/companions/milk_and_mocha/he-idle.gif';
import heIdle2 from '../assets/companions/milk_and_mocha/he-idle-working.gif';
import heIdle3 from '../assets/companions/milk_and_mocha/he-idle-surprised.gif';
import heIdle4 from '../assets/companions/milk_and_mocha/he-idle-reading.gif';
import heDownlineIdle from '../assets/companions/milk_and_mocha/he-downline-idle.gif';
import heDownlineIdle2 from '../assets/companions/milk_and_mocha/he-downline-idle-jumping.gif';

import sheIdle from '../assets/companions/milk_and_mocha/she-idle-sleeping.gif';
import sheIdle2 from '../assets/companions/milk_and_mocha/she-idle-laughting.gif';
import sheIdle3 from '../assets/companions/milk_and_mocha/she-idle-dancing.gif'
import sheIdle4 from '../assets/companions/milk_and_mocha/she-idle-dancing2.gif'
import sheIdle5 from '../assets/companions/milk_and_mocha/she-idle-jumping.gif'
import sheIdle6 from '../assets/companions/milk_and_mocha/she-idle-laughting.gif'
import sheIdle7 from '../assets/companions/milk_and_mocha/she-idle-sleeping.gif'

import sheDownlineIdle from '../assets/companions/milk_and_mocha/she-downline-idle-angrying.gif';
import sheDownlineIdle2 from '../assets/companions/milk_and_mocha/she-downline-idle-crying.gif';
import sheDownlineIdle3 from '../assets/companions/milk_and_mocha/she-downline-idle-waitingforfood.gif';
import sheDownlineIdle4 from '../assets/companions/milk_and_mocha/she-downline-idle-dancing.gif';
import sheWalkingLeft from '../assets/companions/milk_and_mocha/she_walking_left.gif';

import bothWalkingRight from '../assets/companions/milk_and_mocha/both-walking right.gif';

import bothIdle from '../assets/companions/milk_and_mocha/both-idle-sleeping3.gif';
import bothIdle2 from '../assets/companions/milk_and_mocha/both-idle-sleeping2.gif';
import bothIdle3 from '../assets/companions/milk_and_mocha/both-idle-sleeping.gif';
import bothIdle4 from '../assets/companions/milk_and_mocha/both-idle-love.gif';
import bothIdle5 from '../assets/companions/milk_and_mocha/both-idle-fun2.gif';
import bothIdle6 from '../assets/companions/milk_and_mocha/both-idle-fun.gif';
import bothIdle7 from '../assets/companions/milk_and_mocha/both-idle-fun2.gif';
import bothIdle8 from '../assets/companions/milk_and_mocha/both-idle-crying.gif';

import bothDownlineIdle1 from '../assets/companions/milk_and_mocha/both-downline-fun.gif';
import bothDownlineIdle2 from '../assets/companions/milk_and_mocha/both-downline-idle.gif';
import bothDownlineIdle3 from '../assets/companions/milk_and_mocha/both-downline-idle2.gif';
import bothDownlineIdle4 from '../assets/companions/milk_and_mocha/both-downline-idle3.gif';
import bothDownlineIdle5 from '../assets/companions/milk_and_mocha/both-downline-idle-watchingTV.gif';

import bothDownlineDisapearing from '../assets/companions/milk_and_mocha/both-downline-disapearing.gif';

const CompanionBear = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('idle');

  const [companionMode, setCompanionMode] = useState('both'); // 'both', 'male', 'female'
  const [isDisappearing, setIsDisappearing] = useState(false);
  const bearRef = useRef(null);

  // Маппинг анимаций для разных режимов
  const animations = {
    both: {
      idle: [bothIdle, bothIdle2, bothIdle3, bothIdle4, bothIdle5, bothIdle6, bothIdle7, bothIdle8],
      walkingRight: [bothWalkingRight],
      downline: [bothDownlineIdle1, bothDownlineIdle2, bothDownlineIdle3, bothDownlineIdle4, bothDownlineIdle5],
      disappearing: [bothDownlineDisapearing]
    },
    male: {
      idle: [heIdle1, heIdle2, heIdle3, heIdle4],
      downline: [heDownlineIdle, heDownlineIdle2]
    },
    female: {
      idle: [sheIdle, sheIdle2, sheIdle3, sheIdle4, sheIdle5, sheIdle6, sheIdle7],
      walkingLeft: [sheWalkingLeft],
      downline: [sheDownlineIdle, sheDownlineIdle2, sheDownlineIdle3, sheDownlineIdle4]
    }
  };

  // Получаем случайную анимацию из массива для текущего состояния
  const getRandomAnimation = (mode, state) => {
    const availableAnimations = animations[mode][state];
    if (!availableAnimations) return null;
    return availableAnimations[Math.floor(Math.random() * availableAnimations.length)];
  };

  // Находим все элементы, с которыми может взаимодействовать медведь
  const findInteractiveElements = () => {
    const elements = document.querySelectorAll('button, input, select, .card, .widget, .panel, table, .container');
    return Array.from(elements).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 50 && rect.height > 50;
    });
  };

  // Получаем случайную позицию на экране
  const getRandomScreenPosition = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 100; // отступ от краев экрана

    return {
      x: margin + Math.random() * (viewportWidth - 2 * margin),
      y: margin + Math.random() * (viewportHeight - 2 * margin)
    };
  };

  // Получаем позицию для downline анимации
  const getDownlinePosition = (element) => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Если элемент находится в нижней части экрана
    if (rect.bottom > viewportHeight * 0.7) {
      return {
        x: rect.left + Math.random() * rect.width,
        y: rect.bottom - 50 // Размещаем над нижней границей элемента
      };
    }
    
    // Если элемент в верхней части экрана
    return {
      x: rect.left + Math.random() * rect.width,
      y: rect.top - 50 // Размещаем над верхней границей элемента
    };
  };

  // Логика взаимодействия с элементами
  useEffect(() => {
    const interactWithElements = () => {
      const elements = findInteractiveElements();
      if (elements.length === 0) return;

      const randomElement = elements[Math.floor(Math.random() * elements.length)];
      const rect = randomElement.getBoundingClientRect();
      
      // Определяем, будет ли это downline анимация
      const isDownline = Math.random() < 0.7; // 70% шанс downline анимации
      
      if (isDownline) {
        const pos = getDownlinePosition(randomElement);
        setPosition(pos);
        setCurrentAnimation('downline');
      } else {
        // Случайное позиционирование вокруг элемента
        const side = Math.floor(Math.random() * 4);
        let newX, newY;

        switch (side) {
          case 0: // top
            newX = rect.left + Math.random() * rect.width;
            newY = rect.top - 50;
            break;
          case 1: // right
            newX = rect.right + 20;
            newY = rect.top + Math.random() * rect.height;
            break;
          case 2: // bottom
            newX = rect.left + Math.random() * rect.width;
            newY = rect.bottom + 20;
            break;
          case 3: // left
            newX = rect.left - 50;
            newY = rect.top + Math.random() * rect.height;
            break;
        }

        setPosition({ x: newX, y: newY });
        setCurrentAnimation('idle');
      }
    };

    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        interactWithElements();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible, isDisappearing]);

  // Основная логика поведения медведя
  useEffect(() => {
    const showInterval = setInterval(() => {
      if (!isVisible && Math.random() < 0.3) {
        setIsVisible(true);
        setIsDisappearing(false);
        
        // Случайный выбор режима
        const modes = ['both', 'male', 'female'];
        const randomMode = modes[Math.floor(Math.random() * modes.length)];
        setCompanionMode(randomMode);
        
        // Случайное появление в разных частях экрана
        const pos = getRandomScreenPosition();
        setPosition(pos);
        setCurrentAnimation('idle');
      }
    }, 5000);

    const hideInterval = setInterval(() => {
      if (isVisible && !isDisappearing && Math.random() < 0.2) {
        setIsDisappearing(true);
        setCurrentAnimation('disappearing');
        setTimeout(() => {
          setIsVisible(false);
        }, 1000);
      }
    }, 8000);

    const animationInterval = setInterval(() => {
      if (isVisible && !isDisappearing && Math.random() < 0.2) {
        setCurrentAnimation('idle');
      }
    }, 8000);

    return () => {
      clearInterval(showInterval);
      clearInterval(hideInterval);
      clearInterval(animationInterval);
    };
  }, [isVisible, isDisappearing]);

  const updatePosition = () => {
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    
    const newX = Math.random() * maxX;
    const newY = Math.random() * maxY;
    
    setPosition({ x: newX, y: newY });
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={bearRef}
      className={`companion-bear ${currentAnimation} ${isDisappearing ? 'disappearing' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: 'none',
        transition: 'all 0.5s ease-in-out',
        position: 'fixed',
        zIndex: 9999
      }}
    >
      <img 
        src={getRandomAnimation(companionMode, currentAnimation)} 
        alt={`${companionMode} bear`}
        className="bear-image"
      />
    </div>
  );
};

export default CompanionBear; 