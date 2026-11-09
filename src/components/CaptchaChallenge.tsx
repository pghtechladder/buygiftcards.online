"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { renderTurnstileWidget, removeTurnstileWidget, isTurnstileConfigured } from "@/lib/turnstile-client";

interface CaptchaChallengeProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  action?: string;
  className?: string;
}

export function CaptchaChallenge({
  onVerify,
  onExpire,
  onError,
  action = "form",
  className = "",
}: CaptchaChallengeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasTurnstile, setHasTurnstile] = useState(false);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [mathNum1, setMathNum1] = useState(3);
  const [mathNum2, setMathNum2] = useState(4);
  const [mathAnswer, setMathAnswer] = useState("");
  const [mathPassed, setMathPassed] = useState(false);
  const [mathError, setMathError] = useState(false);

  // Initialize interactive math challenge as fallback or primary defense
  useEffect(() => {
    generateNewMath();
    setHasTurnstile(isTurnstileConfigured());
  }, []);

  const generateNewMath = () => {
    const n1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const n2 = Math.floor(Math.random() * 7) + 1; // 1 to 7
    setMathNum1(n1);
    setMathNum2(n2);
    setMathAnswer("");
    setMathPassed(false);
    setMathError(false);
  };

  // Mount Cloudflare Turnstile if site key is configured
  useEffect(() => {
    let widgetId = "";
    let mounted = true;

    if (hasTurnstile && containerRef.current) {
      renderTurnstileWidget(containerRef.current, {
        action,
        onSuccess: (token) => {
          if (!mounted) return;
          setTurnstileReady(true);
          onVerify(token);
        },
        onError: () => {
          if (!mounted) return;
          onError?.();
        },
        onExpire: () => {
          if (!mounted) return;
          onExpire?.();
        },
      }).then((id) => {
        widgetId = id;
      });
    }

    return () => {
      mounted = false;
      if (widgetId) {
        removeTurnstileWidget(widgetId);
      }
    };
  }, [hasTurnstile, action, onVerify, onError, onExpire]);

  const handleMathCheck = (val: string) => {
    setMathAnswer(val);
    const parsed = parseInt(val.trim(), 10);
    if (!isNaN(parsed) && parsed === mathNum1 + mathNum2) {
      setMathPassed(true);
      setMathError(false);
      // Generate a client math challenge token
      const clientMathToken = `math_${mathNum1}_${mathNum2}_${parsed}_${Date.now()}`;
      onVerify(clientMathToken);
    } else {
      setMathPassed(false);
      if (val.trim().length > 0) {
        setMathError(true);
      } else {
        setMathError(false);
      }
    }
  };

  return (
    <div className={`rounded-xl border border-ink-150 bg-ink-50/70 p-3.5 ${className}`}>
      {hasTurnstile ? (
        <div>
          <div ref={containerRef} className="flex justify-center my-1 min-h-[65px]" />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-ink-700">
              <Icon name="shield" size={15} className="text-brand-600" />
              Security Check (CAPTCHA)
            </span>
            <button
              type="button"
              onClick={generateNewMath}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 underline flex items-center gap-1"
            >
              <Icon name="undo" size={12} />
              Change challenge
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center px-3 py-2 bg-white border border-ink-200 rounded-lg text-sm font-mono font-bold text-ink-900 tracking-wider select-none shadow-sm">
              <span>{mathNum1}</span>
              <span className="mx-2 text-ink-400">+</span>
              <span>{mathNum2}</span>
              <span className="mx-2 text-ink-400">=</span>
              <span className="text-ink-400">?</span>
            </div>

            <div className="relative flex-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={3}
                placeholder="Answer"
                value={mathAnswer}
                onChange={(e) => handleMathCheck(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-white font-bold outline-none transition ${
                  mathPassed
                    ? "border-green-500 ring-2 ring-green-100 text-green-700"
                    : mathError
                    ? "border-red-400 ring-2 ring-red-100"
                    : "border-ink-200 focus:border-brand-500"
                }`}
              />
              {mathPassed && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-600 flex items-center">
                  <Icon name="checkCircle" size={16} />
                </span>
              )}
            </div>
          </div>

          <p className="text-[11px] text-ink-500">
            {mathPassed ? (
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <Icon name="checkCircle" size={13} /> Human verified successfully
              </span>
            ) : mathError ? (
              <span className="text-red-500">Incorrect answer. Please calculate {mathNum1} + {mathNum2}</span>
            ) : (
              "Please solve the simple math problem to prove you are human."
            )}
          </p>
        </div>
      )}
    </div>
  );
}

