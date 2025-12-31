'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { JetBrains_Mono } from 'next/font/google';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-jetbrains-mono',
});

const CURSOR_BLINK = keyframes`
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
`;

const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at center, #0a0a0a 0%, #000000 100%);
  overflow: hidden;
  font-family: ${jetbrainsMono.style.fontFamily}, 'JetBrains Mono', 'IBM Plex Mono', monospace;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
`;

const GlowOverlay = styled.div<{ $opacity: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 30% 25%, rgba(234, 234, 234, 0.03) 0%, transparent 70%);
  opacity: ${props => props.$opacity};
  pointer-events: none;
  transition: opacity 0.5s ease;
`;

const FilmGrain = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  pointer-events: none;
`;

const Content = styled.div<{ $opacity: number }>`
  position: relative;
  padding-left: 1rem;
  padding-top: 1rem;
  color: #EAEAEA;
  font-size: clamp(17px, 2vw, 24px);
  line-height: 1.3;
  opacity: ${props => props.$opacity};
  transition: opacity 0.5s ease;
  z-index: 1;
`;

const Line = styled.div`
  white-space: pre;
  min-height: 1.3em;
`;

const LoadingDots = styled.span`
  display: inline-block;
  width: 3ch; /* Fixed width for exactly 3 characters in monospace font */
  text-align: left;
`;

const Cursor = styled.span<{ $shouldBlink: boolean }>`
  display: inline-block;
  width: 0.6em;
  height: 1em;
  background-color: #EAEAEA;
  animation: ${props => props.$shouldBlink ? CURSOR_BLINK : 'none'} 1s step-end infinite;
  vertical-align: baseline;
  margin-left: 2px;
`;

const COMMAND_PREFIX = 'anon@stu202:~$ ';
const COMMAND_SUFFIX = './into-the-void.sh';
const COMMAND = COMMAND_PREFIX + COMMAND_SUFFIX;
const OUTPUT_LINES = [
  'loading', // Base text - dots will be animated
  'preparing your invitation', // Base text - dots will be animated
  'invitation ready',
  '', // Blank line
  'you are invited... into the void',
  'a gathering in space and transition',
  '', // Blank line
  'music',
  'art',
  'people',
  '', // Blank line
  'location: STU202',
  'date: 1/17',
  'time: 8PM-??? (TBD)',
  '', // Blank line
  'awaiting your arrival.', // Cursor will appear after this
  '', // Blank line
];

// Pauses between lines (in seconds)
// Index corresponds to pause AFTER that line index
// Optimized to total exactly 17 seconds
const LINE_PAUSES = [
  0,    // after 'loading' (handled by animation)
  0,    // after 'preparing invitation' (handled by animation)
  0.25, // after 'invitation ready' (reduced to fit 17s)
  0.08, // after blank (reduced to fit 17s)
  0.1,  // after 'you are invited... into the void' (reduced to fit 17s)
  0.2,  // after 'a gathering in space and transition' (reduced to fit 17s)
  0.1,  // after blank (reduced from 0.15)
  0.06, // after 'music' (reduced from 0.15)
  0.06, // after 'art' (reduced from 0.15)
  0.15, // after 'people' (reduced from 0.2)
  0.1,  // after blank (reduced from 0.15)
  0.1,  // after 'location: STU202' (reduced from 0.15)
  0.1,  // after 'date: 1/17' (reduced from 0.15)
  0.1,  // after 'time: 8PM-??? (TBD)' (reduced from 0.15)
  0.15, // after blank (reduced from 0.2)
  0.15, // after blank (reduced from 0.2)
  0,    // after 'awaiting your arrival.' - cursor appears, no pause needed
];

const BASE_TYPING_SPEED = 60; // milliseconds per character (~16-17 cps)
const FAST_TYPING_SPEED = 30; // milliseconds per character (~33 cps) for lines after index 2
const TYPING_VARIATION = 10; // ±10ms variation

const TOTAL_LOOP_TIME = 17000; // milliseconds (17 seconds total)
const IDLE_DURATION = 0; // No idle phase - command prefix shows immediately
const COMMAND_PREFIX_DISPLAY = 0; // Show prefix immediately
const COMMAND_BLINK_DURATION = 3000; // Blink cursor for 3 seconds
const COMMAND_TYPING_START = 1000; // Start typing "./into-the-void" after 3 seconds
const COMMAND_SUFFIX_LENGTH = COMMAND_SUFFIX.length;
const COMMAND_TYPING_DURATION = COMMAND_SUFFIX_LENGTH * BASE_TYPING_SPEED; // Calculate duration based on typing speed
const COMMAND_END = COMMAND_TYPING_START + COMMAND_TYPING_DURATION;
const OUTPUT_START = COMMAND_END + 300; // 0.3s pause after command (reduced from 0.4)
// FADE_START will be calculated dynamically when last line completes
const FADE_DURATION = 360; // Fade duration (~0.36 seconds to fit in 17s total)

// Helper to get random typing delay
const getTypingDelay = (useFast: boolean = false) => {
  const speed = useFast ? FAST_TYPING_SPEED : BASE_TYPING_SPEED;
  return speed + (Math.random() - 0.5) * TYPING_VARIATION * 2;
};

export default function TerminalAnimation() {
  const [displayedCommand, setDisplayedCommand] = useState(COMMAND_PREFIX); // Show prefix immediately
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [loadingDotsLine0, setLoadingDotsLine0] = useState(''); // For the loading dots animation on line 0
  const [loadingDotsLine1, setLoadingDotsLine1] = useState(''); // For the loading dots animation on line 1
  const [showFinalPrompt, setShowFinalPrompt] = useState(false); // Show final prompt line after animation completes
  const [userInputLines, setUserInputLines] = useState<string[]>([]); // Lines typed by user after animation
  const [currentUserInput, setCurrentUserInput] = useState(''); // Current line being typed by user
  const [cursorBlink, setCursorBlink] = useState(true); // Start with blinking cursor
  const [glowOpacity, setGlowOpacity] = useState(1);
  const [textOpacity, setTextOpacity] = useState(1);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const loopTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const startTimeRef = useRef<number>(Date.now());
  const typingStateRef = useRef<{
    lineIndex: number;
    charIndex: number;
  }>({ lineIndex: 0, charIndex: 0 });

  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
    }
  };

  const startLoop = () => {
    clearAllTimeouts();
    const loopStart = Date.now();
    startTimeRef.current = loopStart;

    // Reset state
    setDisplayedCommand(COMMAND_PREFIX); // Show prefix immediately
    setDisplayedLines([]);
    setLoadingDotsLine0(''); // Reset loading dots
    setLoadingDotsLine1(''); // Reset loading dots
    setShowFinalPrompt(false); // Hide final prompt
    setCursorBlink(true); // Start with blinking cursor
    setGlowOpacity(1);
    setTextOpacity(1);

    // Phase 1: Show "anon@stu202:~$ " with blinking cursor (0-3000ms)
    // Already set above - prefix is displayed, cursor is blinking

    // Phase 2: Type "./into-the-void" (3000ms onwards)
    let commandSuffixIndex = 0;
    const typeCommandSuffix = () => {
      if (commandSuffixIndex < COMMAND_SUFFIX.length) {
        setDisplayedCommand(COMMAND_PREFIX + COMMAND_SUFFIX.slice(0, commandSuffixIndex + 1));
        setCursorBlink(false);
        commandSuffixIndex++;
        const delay = getTypingDelay();
        const timeout = setTimeout(typeCommandSuffix, delay);
        timeoutRefs.current.push(timeout);
      } else {
        // Command complete
        setDisplayedCommand(COMMAND);
        setCursorBlink(false);
      }
    };
    const commandTypingStartTimeout = setTimeout(typeCommandSuffix, COMMAND_TYPING_START);
    timeoutRefs.current.push(commandTypingStartTimeout);
    
    // Stop blinking when typing starts
    const stopBlinkTimeout = setTimeout(() => {
      setCursorBlink(false);
    }, COMMAND_TYPING_START);
    timeoutRefs.current.push(stopBlinkTimeout);

    // Phase 3: Type output lines (4200-12800ms)
    typingStateRef.current = { lineIndex: 0, charIndex: 0 };

    // Handle loading dots animation - fixed width using fixed container
    const animateLoadingDots = (setDots: (dots: string) => void, cycles: number = 6, onComplete?: () => void) => {
      let loadingDotCycle = 0;
      const cycleDuration = 333; // 333ms per cycle to get 2 seconds for 6 cycles (6 * 333ms = ~2000ms)
      const animate = () => {
        // Always use 3 character positions to prevent width changes
        // Pad with spaces to maintain fixed width: ".  ", ".. ", "..."
        const dots = ['.  ', '.. ', '...'];
        const currentDots = dots[loadingDotCycle % 3];
        setDots(currentDots);
        loadingDotCycle++;
        
        // Animate for specified cycles to get ~2 seconds total (6 cycles * 333ms = ~2000ms)
        if (loadingDotCycle < cycles) {
          const timeout = setTimeout(animate, cycleDuration);
          timeoutRefs.current.push(timeout);
        } else {
          // Stop animation and clear dots
          setDots('');
          // Call completion callback if provided
          if (onComplete) {
            onComplete();
          }
        }
      };
      animate();
    };

    const typeOutputLine = () => {
      const { lineIndex, charIndex } = typingStateRef.current;
      
      if (lineIndex >= OUTPUT_LINES.length) {
        // All lines typed, start fade
        setCursorBlink(false);
        // Start fade immediately after last line completes
        const fadeInterval = 50; // Update every 50ms for smooth fade
        let fadeProgress = 0;
        const fade = () => {
          fadeProgress += fadeInterval;
          const progress = Math.min(fadeProgress / FADE_DURATION, 1);
          setGlowOpacity(1 - progress * 0.5);
          setTextOpacity(1 - progress * 0.15);
          if (progress < 1) {
            const timeout = setTimeout(fade, fadeInterval);
            timeoutRefs.current.push(timeout);
          } else {
            // Fade complete, show final prompt line with blinking cursor permanently
            setShowFinalPrompt(true);
            setCursorBlink(true);
          }
        };
        fade();
        return;
      }

      const currentLine = OUTPUT_LINES[lineIndex];
      
      // Special handling for first line (loading) - show instantly and start loading animation
      if (lineIndex === 0 && charIndex === 0) {
        // Show "loading" instantly
        setDisplayedLines([currentLine]);
        // Start loading dots animation (2 seconds)
        animateLoadingDots(setLoadingDotsLine0, 6);
        // Move to next line after loading animation completes (2 seconds = 2000ms)
        const loadingDuration = 2000;
        typingStateRef.current.lineIndex = 1;
        typingStateRef.current.charIndex = 0;
        const timeout = setTimeout(typeOutputLine, loadingDuration);
        timeoutRefs.current.push(timeout);
        return;
      }
      
      // Special handling for second line (preparing invitation) - show instantly and start loading animation
      if (lineIndex === 1 && charIndex === 0) {
        // Show "preparing invitation" instantly
        setDisplayedLines(prev => {
          const newLines = [...prev];
          newLines[0] = OUTPUT_LINES[0]; // Ensure first line is complete
          newLines[1] = currentLine;
          return newLines;
        });
        // Start loading dots animation (2 seconds)
        animateLoadingDots(setLoadingDotsLine1, 6);
        // Move to next line after loading animation completes (2 seconds = 2000ms)
        const loadingDuration = 2000;
        typingStateRef.current.lineIndex = 2;
        typingStateRef.current.charIndex = 0;
        const timeout = setTimeout(typeOutputLine, loadingDuration);
        timeoutRefs.current.push(timeout);
        return;
      }
      
      if (charIndex < currentLine.length) {
        // Type next character of current line
        typingStateRef.current.charIndex = charIndex + 1;
        const currentLineText = currentLine.slice(0, charIndex + 1);
        
        // Build the lines array: all previous lines complete + current line partial
        const newLines: string[] = [];
        for (let i = 0; i < lineIndex; i++) {
          newLines[i] = OUTPUT_LINES[i];
        }
        newLines[lineIndex] = currentLineText;
        
        setDisplayedLines(newLines);
        setCursorBlink(false);
        
        // Stop blinking after "awaiting your arrival." is complete
        if (lineIndex === OUTPUT_LINES.length - 1 && charIndex + 1 === currentLine.length) {
          setCursorBlink(false);
        }
        
        // Use fast typing speed for lines after index 2
        const useFastSpeed = lineIndex > 2;
        const delay = getTypingDelay(useFastSpeed);
        const timeout = setTimeout(typeOutputLine, delay);
        timeoutRefs.current.push(timeout);
      } else {
        // Line complete - mark it as complete
        const newLines: string[] = [];
        for (let i = 0; i <= lineIndex; i++) {
          newLines[i] = OUTPUT_LINES[i];
        }
        setDisplayedLines(newLines);
        
        // Stop blinking after "awaiting your arrival." - cursor should appear steady
        if (currentLine === 'awaiting your arrival.') {
          setCursorBlink(false);
        }
        
        // Move to next line after pause
        const pause = LINE_PAUSES[lineIndex] || 0.3;
        typingStateRef.current.lineIndex = lineIndex + 1;
        typingStateRef.current.charIndex = 0;
        const timeout = setTimeout(typeOutputLine, pause * 1000);
        timeoutRefs.current.push(timeout);
      }
    };

    // Calculate when to start typing output (after command + 0.4s pause)
    const outputStartTimeout = setTimeout(() => {
      // Ensure command is complete before starting output
      setDisplayedCommand(COMMAND);
      typeOutputLine();
    }, OUTPUT_START);
    timeoutRefs.current.push(outputStartTimeout);

    // Animation does not reset - after completion, shows prompt with blinking cursor permanently
  };

  useEffect(() => {
    startLoop();
    return () => {
      clearAllTimeouts();
    };
  }, []);

  // Handle keyboard input after animation completes
  useEffect(() => {
    if (!showFinalPrompt) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle input if animation is complete
      if (!showFinalPrompt) return;

      if (e.key === 'Enter') {
        // Move current input to completed lines and start new line below
        e.preventDefault();
        setUserInputLines(prev => [...prev, currentUserInput]);
        setCurrentUserInput('');
      } else if (e.key === 'Backspace') {
        // Remove last character
        e.preventDefault();
        setCurrentUserInput(prev => prev.slice(0, -1));
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Add printable character
        e.preventDefault();
        setCurrentUserInput(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFinalPrompt, currentUserInput]);

  // Determine cursor visibility and blink state
  const isIdle = displayedCommand === COMMAND_PREFIX && displayedLines.length === 0;
  const inFadePhase = textOpacity < 1;

  // Cursor blinks during idle phase or in final prompt
  const shouldBlinkCursor = cursorBlink && (isIdle || showFinalPrompt);

  return (
    <Container className={jetbrainsMono.variable}>
      <GlowOverlay $opacity={glowOpacity} />
      <FilmGrain />
      <Content $opacity={textOpacity}>
        {displayedCommand && (
          <Line>
            {displayedCommand}
            {displayedLines.length === 0 && !inFadePhase && !showFinalPrompt && (
              <Cursor $shouldBlink={shouldBlinkCursor} />
            )}
          </Line>
        )}
        {displayedLines.map((line, index) => {
          const loadingDots = index === 0 ? loadingDotsLine0 : index === 1 ? loadingDotsLine1 : '';
          const isLastLine = index === displayedLines.length - 1;
          const isAwaitingArrival = line === 'awaiting your arrival.';
          return (
            <Line key={index}>
              {line}
              {loadingDots && <LoadingDots>{loadingDots}</LoadingDots>}
              {isLastLine && isAwaitingArrival && !loadingDots && !showFinalPrompt && (
                <Cursor $shouldBlink={false} />
              )}
            </Line>
          );
        })}
        {showFinalPrompt && (
          <>
            {userInputLines.map((line, index) => (
              <Line key={`user-${index}`}>
                {COMMAND_PREFIX}
                {line}
              </Line>
            ))}
            <Line>
              {COMMAND_PREFIX}
              {currentUserInput}
              <Cursor $shouldBlink={shouldBlinkCursor} />
            </Line>
          </>
        )}
      </Content>
    </Container>
  );
}
