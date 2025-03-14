import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CompanionCat.css';

// Импортируем анимации пикачу
import pikaDownlineAngry from '../assets/companions/pickachu/pika-downline-angry.gif';
import pikaDownlineExciting from '../assets/companions/pickachu/pika-downline-exciting.gif';
import pikaDownlineHello from '../assets/companions/pickachu/pika-downline-hello.gif';
import pikaDownlineIdle from '../assets/companions/pickachu/pika-downline-idle.gif';
import pikaDownlineSleepy from '../assets/companions/pickachu/pika-downline-sleepy.gif';
import pikaDownlineTease1 from '../assets/companions/pickachu/pika-downline-tease1.gif';
import pikaDownlineTease2 from '../assets/companions/pickachu/pika-downline-tease2.gif';

import pikaIdleBoxing from '../assets/companions/pickachu/pika-idle-boxing.gif';
import pikaIdleClap from '../assets/companions/pickachu/pika-idle-clap.gif';
import pikaIdleCrying from '../assets/companions/pickachu/pika-idle-crying.gif';
import pikaIdleDance from '../assets/companions/pickachu/pika-idle-dance.gif';
import pikaIdleDanceLove from '../assets/companions/pickachu/pika-idle-dance-love.gif';
import pikaIdleEating from '../assets/companions/pickachu/pika-idle-eating.gif';
import pikaIdleJumpHappy from '../assets/companions/pickachu/pika-idle-jump-happy.gif';
import pikaIdleLaughing from '../assets/companions/pickachu/pika-idle-laughting.gif';
import pikaIdleNonono from '../assets/companions/pickachu/pika-idle-nonono.gif';
import pikaIdleUmm from '../assets/companions/pickachu/pika-idle-umm.gif';
import pikaIdleUmm2 from '../assets/companions/pickachu/pika-idle-umm2.gif';

import pikaWalkingLeft from '../assets/companions/pickachu/pika-walking-left.gif';

const CompanionPikachu = () => {
  const [position, setPosition] = useState({ x: -100, y: 0 }); // Начальная позиция за пределами экрана
  const [isVisible, setIsVisible] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('walkingLeft');
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [targetPosition, setTargetPosition] = useState(null);
  const pikachuRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Добавляем состояние для отслеживания модальных окон
  const [activeModal, setActiveModal] = useState(null);
  const modalObserver = useRef(null);
  const lastInteractionTime = useRef(Date.now());

  // Маппинг анимаций
  const animations = {
    idle: [
      pikaIdleBoxing,
      pikaIdleClap,
      pikaIdleCrying,
      pikaIdleDance,
      pikaIdleDanceLove,
      pikaIdleEating,
      pikaIdleJumpHappy,
      pikaIdleLaughing,
      pikaIdleNonono,
      pikaIdleUmm,
      pikaIdleUmm2
    ],
    walkingLeft: [pikaWalkingLeft],
    downline: [
      pikaDownlineAngry,
      pikaDownlineExciting,
      pikaDownlineHello,
      pikaDownlineIdle,
      pikaDownlineSleepy,
      pikaDownlineTease1,
      pikaDownlineTease2
    ],
    error: [pikaIdleBoxing, pikaIdleUmm, pikaIdleUmm2],
    accessDenied: [pikaIdleNonono],
    music: [pikaIdleDanceLove, pikaIdleDance]
  };

  // Мемоизируем функции, которые используются в useEffect
  const findInteractiveElements = useCallback(() => {
    const elements = document.querySelectorAll('button, input, select, .card, .widget, .panel, table, .container');
    return Array.from(elements).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 50 && rect.height > 50;
    });
  }, []);

  const findErrorElements = useCallback(() => {
    const errorElements = document.querySelectorAll('.error, .error-message, [data-error="true"], .alert-danger');
    const accessDeniedElements = document.querySelectorAll('[data-access-denied="true"], .access-denied');
    
    return {
      errors: Array.from(errorElements),
      accessDenied: Array.from(accessDeniedElements)
    };
  }, []);

  const checkForAudioPlayback = useCallback(() => {
    const audioElements = document.querySelectorAll('audio, video');
    return Array.from(audioElements).some(el => !el.paused);
  }, []);

  const getRandomScreenPosition = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 100;

    return {
      x: margin + Math.random() * (viewportWidth - 2 * margin),
      y: margin + Math.random() * (viewportHeight - 2 * margin)
    };
  }, []);

  const getDownlinePosition = useCallback((element) => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    if (rect.bottom > viewportHeight * 0.7) {
      return {
        x: rect.left + Math.random() * rect.width,
        y: rect.bottom - 50
      };
    }
    
    return {
      x: rect.left + Math.random() * rect.width,
      y: rect.top - 50
    };
  }, []);

  const moveToTarget = useCallback(() => {
    if (!targetPosition) return;

    const currentX = position.x;
    const currentY = position.y;
    const dx = targetPosition.x - currentX;
    const dy = targetPosition.y - currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      setPosition(targetPosition);
      setTargetPosition(null);
      setCurrentAnimation('idle');
      return;
    }

    const speed = 5;
    const ratio = speed / distance;
    const newX = currentX + dx * ratio;
    const newY = currentY + dy * ratio;

    setPosition({ x: newX, y: newY });
    animationFrameRef.current = requestAnimationFrame(moveToTarget);
  }, [position, targetPosition]);

  const interactWithElements = useCallback(() => {
    // Проверяем, прошло ли достаточно времени с последнего взаимодействия
    const now = Date.now();
    if (now - lastInteractionTime.current < 5000) return;
    lastInteractionTime.current = now;

    const { errors, accessDenied } = findErrorElements();
    
    if (accessDenied.length > 0) {
      const element = accessDenied[Math.floor(Math.random() * accessDenied.length)];
      const rect = element.getBoundingClientRect();
      setPosition({
        x: rect.left + Math.random() * rect.width,
        y: rect.top - 50
      });
      setCurrentAnimation('accessDenied');
      return;
    }
    
    if (errors.length > 0) {
      const element = errors[Math.floor(Math.random() * errors.length)];
      const rect = element.getBoundingClientRect();
      setPosition({
        x: rect.left + Math.random() * rect.width,
        y: rect.top - 50
      });
      setCurrentAnimation('error');
      return;
    }

    if (checkForAudioPlayback()) {
      const pos = getRandomScreenPosition();
      setPosition(pos);
      setCurrentAnimation('music');
      return;
    }

    const elements = findInteractiveElements();
    if (elements.length === 0) return;

    const randomElement = elements[Math.floor(Math.random() * elements.length)];
    const rect = randomElement.getBoundingClientRect();
    
    const isDownline = Math.random() < 0.7;
    
    if (isDownline) {
      const pos = getDownlinePosition(randomElement);
      setPosition(pos);
      setCurrentAnimation('downline');
    } else {
      const side = Math.floor(Math.random() * 4);
      let newX, newY;

      switch (side) {
        case 0:
          newX = rect.left + Math.random() * rect.width;
          newY = rect.top - 50;
          break;
        case 1:
          newX = rect.right + 20;
          newY = rect.top + Math.random() * rect.height;
          break;
        case 2:
          newX = rect.left + Math.random() * rect.width;
          newY = rect.bottom + 20;
          break;
        case 3:
          newX = rect.left - 50;
          newY = rect.top + Math.random() * rect.height;
          break;
      }

      setPosition({ x: newX, y: newY });
      setCurrentAnimation('idle');
    }
  }, [findErrorElements, findInteractiveElements, checkForAudioPlayback, getRandomScreenPosition, getDownlinePosition]);

  // Эффект для анимации движения
  useEffect(() => {
    if (targetPosition) {
      moveToTarget();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [targetPosition, moveToTarget]);

  // Эффект для проверки взаимодействий
  useEffect(() => {
    if (!isVisible || isDisappearing) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        interactWithElements();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible, isDisappearing, interactWithElements]);

  // Основная логика поведения пикачу
  useEffect(() => {
    const appearFromSide = () => {
      const viewportHeight = window.innerHeight;
      const randomY = Math.random() * (viewportHeight - 200) + 100;
      const targetX = Math.random() * (window.innerWidth - 300) + 150;
      
      setPosition({ x: -100, y: randomY });
      setIsVisible(true);
      setCurrentAnimation('walkingLeft');
      setTargetPosition({ x: targetX, y: randomY });
    };

    const showInterval = setInterval(() => {
      if (!isVisible && Math.random() < 0.3) {
        appearFromSide();
      }
    }, 5000);

    const hideInterval = setInterval(() => {
      if (isVisible && !isDisappearing && Math.random() < 0.2) {
        setIsDisappearing(true);
        setCurrentAnimation('downline');
        setTimeout(() => {
          setIsVisible(false);
          setIsDisappearing(false);
        }, 1000);
      }
    }, 8000);

    return () => {
      clearInterval(showInterval);
      clearInterval(hideInterval);
    };
  }, [isVisible, isDisappearing]);

  // Получаем случайную анимацию из массива для текущего состояния
  const getRandomAnimation = (state) => {
    const availableAnimations = animations[state];
    if (!availableAnimations) return null;
    return availableAnimations[Math.floor(Math.random() * availableAnimations.length)];
  };

  // Функция для проверки, находится ли Пикачу в зоне модального окна
  const isInModalArea = (modalRect) => {
    const pikachuRect = {
      left: position.x,
      right: position.x + 100, // примерная ширина Пикачу
      top: position.y,
      bottom: position.y + 100 // примерная высота Пикачу
    };

    return !(pikachuRect.right < modalRect.left || 
             pikachuRect.left > modalRect.right || 
             pikachuRect.bottom < modalRect.top || 
             pikachuRect.top > modalRect.bottom);
  };

  // Функция для получения безопасной позиции вне модального окна
  const getSafePosition = (modalRect) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 100;

    // Пробуем разные стороны экрана для размещения
    const positions = [
      // Слева от модального окна
      { x: Math.max(margin, modalRect.left - 150), y: modalRect.top + modalRect.height / 2 },
      // Справа от модального окна
      { x: Math.min(viewportWidth - margin, modalRect.right + 50), y: modalRect.top + modalRect.height / 2 },
      // Сверху от модального окна
      { x: modalRect.left + modalRect.width / 2, y: Math.max(margin, modalRect.top - 150) },
      // Снизу от модального окна
      { x: modalRect.left + modalRect.width / 2, y: Math.min(viewportHeight - margin, modalRect.bottom + 50) }
    ];

    // Выбираем случайную позицию из доступных
    return positions[Math.floor(Math.random() * positions.length)];
  };

  // Функция для обработки появления модального окна
  const handleModalAppear = (modalElement) => {
    const modalRect = modalElement.getBoundingClientRect();
    
    // Если Пикачу находится в зоне модального окна
    if (isInModalArea(modalRect)) {
      const safePosition = getSafePosition(modalRect);
      setTargetPosition(safePosition);
      setCurrentAnimation('walkingLeft');
    }
  };

  // Настройка наблюдателя за модальными окнами
  useEffect(() => {
    const observerCallback = (mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) { // Проверяем, что это HTML элемент
            const modalElement = node.classList.contains('modal') ? 
              node : node.querySelector('.modal');
            
            if (modalElement) {
              setActiveModal(modalElement);
              handleModalAppear(modalElement);
            }
          }
        }
      }
    };

    modalObserver.current = new MutationObserver(observerCallback);
    modalObserver.current.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      if (modalObserver.current) {
        modalObserver.current.disconnect();
      }
    };
  }, [position]);

  // Обработка изменения размеров модального окна
  useEffect(() => {
    if (activeModal) {
      const resizeObserver = new ResizeObserver(() => {
        handleModalAppear(activeModal);
      });

      resizeObserver.observe(activeModal);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [activeModal]);

  if (!isVisible) return null;

  return (
    <div 
      ref={pikachuRef}
      className={`companion-bear ${currentAnimation} ${isDisappearing ? 'disappearing' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: 'none',
        transition: targetPosition ? 'none' : 'all 0.5s ease-in-out',
        position: 'fixed',
        zIndex: 9999
      }}
    >
      <img 
        src={getRandomAnimation(currentAnimation)} 
        alt="Pikachu companion"
        className="bear-image"
        style={{
          transform: currentAnimation === 'walkingLeft' ? 'scaleX(-1)' : 'none'
        }}
      />
    </div>
  );
};

export default CompanionPikachu; 