'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const ScrollContainer = styled.div`
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(234, 234, 234, 0.2);
    border-radius: 4px;
    
    &:hover {
      background: rgba(234, 234, 234, 0.3);
    }
  }
`;

const Content = styled.div<{ $opacity: number }>`
  position: relative;
  padding-left: 1rem;
  padding-top: 1rem;
  padding-bottom: 5%;
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

const DirectoryName = styled.span`
  color: #87CEEB;
  font-weight: 500;
`;

const FileName = styled.span`
  color: #EAEAEA;
`;

const ExecutableName = styled.span`
  color: #90EE90;
  font-weight: 500;
`;

const COMMAND_PREFIX = 'anon@stu202:~$ ';
const COMMAND_SUFFIX = './into-the-void.sh';
const COMMAND = COMMAND_PREFIX + COMMAND_SUFFIX;

// Virtual file system structure
interface FileSystemNode {
  type: 'file' | 'directory';
  name: string;
  content?: string; // For files
  executable?: boolean; // For executable files
  children?: Record<string, FileSystemNode>; // For directories
}

const VIRTUAL_FS: FileSystemNode = {
  type: 'directory',
  name: '/',
  children: {
    'into-the-void.sh': {
      type: 'file',
      name: 'into-the-void.sh',
      content: '#!/bin/bash\n# Execute this script to replay the animation',
      executable: true,
    },
    'readme.txt': {
      type: 'file',
      name: 'readme.txt',
      content: 'Welcome to the void.\n\nThis is a space between spaces.\nA moment of transition.\n\nExplore if you dare.',
    },
    'manifesto': {
      type: 'file',
      name: 'manifesto',
      content: 'we gather not in darkness\nbut in transition\nbetween what was\nand what will be\n\nthe void is not empty\nit is potential',
    },
    'music': {
      type: 'file',
      name: 'music',
      content: 'sound waves in space\nfrequencies that bridge\nsilence and noise\nrhythm in the transition',
    },
    '.void': {
      type: 'directory',
      name: '.void',
      children: {
        'secret': {
          type: 'file',
          name: 'secret',
          content: 'the real invitation\nwas always here\n\n8pm sharp\nbring nothing\nexpect everything',
        },
        'truth.txt': {
          type: 'file',
          name: 'truth.txt',
          content: 'STU202 is more than a room.\nIt\'s a portal.\nA space for transformation.\n\nOn January 17th, we cross over.',
        },
      },
    },
    '.secrets': {
      type: 'directory',
      name: '.secrets',
      children: {
        'hidden': {
          type: 'file',
          name: 'hidden',
          content: 'some things are meant to be discovered\nnot announced\n\nfind them\nfeel them\nbecome them',
        },
        'clues': {
          type: 'file',
          name: 'clues',
          content: 'music = vibration\nart = expression\npeople = connection\n\ntogether = void',
        },
        '.deep': {
          type: 'directory',
          name: '.deep',
          children: {
            'final': {
              type: 'file',
              name: 'final',
              content: 'you found it.\n\nthe deepest secret:\n\nthis gathering is not just an event.\nit\'s a ritual.\na ceremony of transition.\n\nprepare yourself.',
            },
          },
        },
      },
    },
    'gathering': {
      type: 'directory',
      name: 'gathering',
      children: {
        'details': {
          type: 'file',
          name: 'details',
          content: 'location: STU202\ndate: January 17th\ntime: 8PM - ???\n\nwhat: transformation\nhow: together\nwhy: because we must',
        },
        'expectations': {
          type: 'file',
          name: 'expectations',
          content: 'leave your assumptions at the door\nbring only yourself\nand an openness to change\n\nthe void rewards the curious',
        },
      },
    },
  },
};

// Available commands
const AVAILABLE_COMMANDS = {
  help: 'help - show available commands',
  ls: 'ls - list directory contents (use -a to show hidden files)',
  cd: 'cd - change directory',
  cat: 'cat - display file contents',
  pwd: 'pwd - print working directory',
  clear: 'clear - clear the terminal',
};

// Helper functions for file system navigation (pure functions)
const getCurrentDirNode = (fs: FileSystemNode, dir: string): FileSystemNode => {
  if (dir === '~' || dir === '/') {
    return fs;
  }
  const pathParts = dir.replace(/^~/, '').replace(/^\//, '').split('/').filter(p => p);
  let node: FileSystemNode = fs;
  for (const part of pathParts) {
    if (node.children && node.children[part]) {
      node = node.children[part];
    } else {
      return node; // Return parent if path invalid
    }
  }
  return node;
};

const resolvePathWithDir = (fs: FileSystemNode, path: string, currentDir: string): FileSystemNode | null => {
  if (path.startsWith('/')) {
    // Absolute path
    const parts = path.split('/').filter(p => p);
    let node: FileSystemNode = fs;
    for (const part of parts) {
      if (node.children && node.children[part]) {
        node = node.children[part];
      } else {
        return null;
      }
    }
    return node;
  } else if (path === '..') {
    // Parent directory
    if (currentDir === '~' || currentDir === '/') {
      return fs;
    }
    const parts = currentDir.replace(/^~/, '').replace(/^\//, '').split('/').filter(p => p);
    parts.pop();
    if (parts.length === 0) {
      return fs;
    }
    return resolvePathWithDir(fs, '/' + parts.join('/'), currentDir);
  } else if (path === '~' || path === '') {
    return fs;
  } else {
    // Relative path
    const current = getCurrentDirNode(fs, currentDir);
    if (current.children && current.children[path]) {
      return current.children[path];
    }
    return null;
  }
};

// Command execution (pure function)
const executeCommandWithDir = (fs: FileSystemNode, input: string, dir: string): string[] => {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  switch (command) {
    case 'help':
      return Object.values(AVAILABLE_COMMANDS);

    case 'pwd':
      return [dir];

    case 'ls':
      const showHidden = args.includes('-a') || args.includes('--all');
      const targetPath = args.find(arg => !arg.startsWith('-'));
      const targetDir = targetPath ? resolvePathWithDir(fs, targetPath, dir) : getCurrentDirNode(fs, dir);
      
      if (!targetDir || targetDir.type !== 'directory') {
        return [`ls: cannot access '${targetPath || ''}': No such file or directory`];
      }
      
      // Return structured output with type information for rendering
      const items: Array<{ name: string; type: 'file' | 'directory'; executable?: boolean }> = [];
      if (targetDir.children) {
        Object.keys(targetDir.children).forEach(name => {
          if (showHidden || !name.startsWith('.')) {
            const child = targetDir.children![name];
            items.push({ 
              name, 
              type: child.type,
              executable: child.executable 
            });
          }
        });
      }
      const sorted = items.sort((a, b) => {
        // Sort: directories first, then files; hidden items at end
        const aHidden = a.name.startsWith('.');
        const bHidden = b.name.startsWith('.');
        if (aHidden !== bHidden) return aHidden ? 1 : -1;
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      // Return as special format strings that can be parsed for styling
      return sorted.map(item => {
        if (item.executable) {
          return `__LS_executable__${item.name}`;
        }
        return `__LS_${item.type}__${item.name}`;
      });

    case 'cd':
      if (args.length === 0 || args[0] === '~') {
        return [];
      }
      const cdPath = args[0];
      const target = resolvePathWithDir(fs, cdPath, dir);
      if (!target) {
        return [`cd: no such file or directory: ${cdPath}`];
      }
      if (target.type !== 'directory') {
        return [`cd: not a directory: ${cdPath}`];
      }
      // Directory change is handled in the keyboard handler
      return [];

    case 'cat':
      if (args.length === 0) {
        return ['cat: missing file operand'];
      }
      const filePath = args[0];
      const fileNode = resolvePathWithDir(fs, filePath, dir);
      if (!fileNode) {
        return [`cat: ${filePath}: No such file or directory`];
      }
      if (fileNode.type !== 'file') {
        return [`cat: ${filePath}: Is a directory`];
      }
      return fileNode.content ? fileNode.content.split('\n') : [''];

    default:
      // Check if it's an executable file (like ./into-the-void.sh)
      if (command.startsWith('./') || command.includes('/')) {
        const scriptPath = command.startsWith('./') ? command.slice(2) : command;
        const scriptNode = resolvePathWithDir(fs, scriptPath, dir);
        if (scriptNode && scriptNode.type === 'file' && scriptNode.executable) {
          // Executable files are handled in the keyboard handler, not here
          // This is just for command completion/error messages
          return [`bash: ${command}: command not found`];
        }
      }
      return [`${command}: command not found`];
  }
};
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
  const [commandOutputs, setCommandOutputs] = useState<string[][]>([]); // Output arrays for each command
  const [commandDirectories, setCommandDirectories] = useState<string[]>([]); // Directory for each command
  const [currentUserInput, setCurrentUserInput] = useState(''); // Current line being typed by user
  const [currentDirectory, setCurrentDirectory] = useState<string>('~'); // Current working directory
  const [cursorBlink, setCursorBlink] = useState(true); // Start with blinking cursor
  const [isScriptRunning, setIsScriptRunning] = useState(false); // Track if inline script animation is running
  const [commandHistory, setCommandHistory] = useState<string[]>([]); // History of entered commands
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // Current position in history (-1 = no history selected, showing current input)
  const savedInputRef = useRef<string>(''); // Store current input when navigating history
  const [glowOpacity, setGlowOpacity] = useState(1);
  const [textOpacity, setTextOpacity] = useState(1);
  
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const loopTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const startTimeRef = useRef<number>(Date.now());
  const typingStateRef = useRef<{
    lineIndex: number;
    charIndex: number;
  }>({ lineIndex: 0, charIndex: 0 });
  const currentDirectoryRef = useRef<string>('~'); // Ref to track current directory synchronously
  const contentEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling to bottom
  
  // Sync ref with state
  useEffect(() => {
    currentDirectoryRef.current = currentDirectory;
  }, [currentDirectory]);

  // Auto-scroll when prompt appears or new content is added
  useEffect(() => {
    if (showFinalPrompt) {
      setTimeout(() => {
        contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [showFinalPrompt, userInputLines, commandOutputs]);

  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
    }
  };

  const startLoop = useCallback(() => {
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
  }, []);

  // Function to run animation inline (without command typing phase)
  const runAnimationInline = useCallback((commandIndex: number) => {
    clearAllTimeouts();
    setIsScriptRunning(true); // Hide prompt while script is running
    
    let loadingDots0 = '';
    let loadingDots1 = '';

    // Handle loading dots animation
    const animateLoadingDots = (lineNum: 0 | 1, cycles: number = 6, onComplete?: () => void) => {
      let loadingDotCycle = 0;
      const cycleDuration = 333;
      const animate = () => {
        const dots = ['.  ', '.. ', '...'];
        const currentDots = dots[loadingDotCycle % 3];
        if (lineNum === 0) {
          loadingDots0 = currentDots;
        } else {
          loadingDots1 = currentDots;
        }
        
        // Update output
        setCommandOutputs(prev => {
          const newOutputs = [...prev];
          if (!newOutputs[commandIndex]) {
            newOutputs[commandIndex] = [];
          }
          const output = [...newOutputs[commandIndex]];
          if (lineNum === 0) {
            output[0] = OUTPUT_LINES[0] + loadingDots0;
          } else {
            output[0] = OUTPUT_LINES[0];
            output[1] = OUTPUT_LINES[1] + loadingDots1;
          }
          newOutputs[commandIndex] = output;
          return newOutputs;
        });
        
        loadingDotCycle++;
        
        if (loadingDotCycle < cycles) {
          const timeout = setTimeout(animate, cycleDuration);
          timeoutRefs.current.push(timeout);
        } else {
          if (lineNum === 0) {
            loadingDots0 = '';
          } else {
            loadingDots1 = '';
          }
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
        // All lines typed, animation complete - show prompt again
        setIsScriptRunning(false);
        return;
      }

      const currentLine = OUTPUT_LINES[lineIndex];
      
      // Special handling for first line (loading) - show instantly and start loading animation
      if (lineIndex === 0 && charIndex === 0) {
        setCommandOutputs(prev => {
          const newOutputs = [...prev];
          if (!newOutputs[commandIndex]) {
            newOutputs[commandIndex] = [];
          }
          newOutputs[commandIndex] = [currentLine];
          return newOutputs;
        });
        animateLoadingDots(0, 6, () => {
          typingStateRef.current.lineIndex = 1;
          typingStateRef.current.charIndex = 0;
          const timeout = setTimeout(typeOutputLine, 100);
          timeoutRefs.current.push(timeout);
        });
        return;
      }
      
      // Special handling for second line (preparing invitation) - show instantly and start loading animation
      if (lineIndex === 1 && charIndex === 0) {
        setCommandOutputs(prev => {
          const newOutputs = [...prev];
          if (!newOutputs[commandIndex]) {
            newOutputs[commandIndex] = [];
          }
          newOutputs[commandIndex] = [OUTPUT_LINES[0], currentLine];
          return newOutputs;
        });
        animateLoadingDots(1, 6, () => {
          typingStateRef.current.lineIndex = 2;
          typingStateRef.current.charIndex = 0;
          const timeout = setTimeout(typeOutputLine, 100);
          timeoutRefs.current.push(timeout);
        });
        return;
      }

      // Regular line typing
      if (charIndex < currentLine.length) {
        const currentText = currentLine.slice(0, charIndex + 1);
        setCommandOutputs(prev => {
          const newOutputs = [...prev];
          if (!newOutputs[commandIndex]) {
            newOutputs[commandIndex] = [];
          }
          const output = [...newOutputs[commandIndex]];
          // Ensure all previous lines are complete
          for (let i = 0; i < lineIndex; i++) {
            if (!output[i]) {
              output[i] = OUTPUT_LINES[i];
            }
          }
          output[lineIndex] = currentText;
          newOutputs[commandIndex] = output;
          return newOutputs;
        });
        typingStateRef.current.charIndex++;
        const useFast = lineIndex >= 2;
        const delay = getTypingDelay(useFast);
        const timeout = setTimeout(typeOutputLine, delay);
        timeoutRefs.current.push(timeout);
      } else {
        // Line complete, move to next line
        setCommandOutputs(prev => {
          const newOutputs = [...prev];
          if (!newOutputs[commandIndex]) {
            newOutputs[commandIndex] = [];
          }
          const output = [...newOutputs[commandIndex]];
          // Ensure all previous lines are complete
          for (let i = 0; i <= lineIndex; i++) {
            output[i] = OUTPUT_LINES[i];
          }
          newOutputs[commandIndex] = output;
          return newOutputs;
        });
        typingStateRef.current.lineIndex++;
        typingStateRef.current.charIndex = 0;
        const pause = LINE_PAUSES[lineIndex] || 0;
        const timeout = setTimeout(typeOutputLine, pause * 1000);
        timeoutRefs.current.push(timeout);
      }
    };

    // Start typing output lines immediately (skip command typing)
    typingStateRef.current = { lineIndex: 0, charIndex: 0 };
    typeOutputLine();
  }, []);

  useEffect(() => {
    startLoop();
    return () => {
      clearAllTimeouts();
    };
  }, [startLoop]);


  // Handle keyboard input after animation completes
  useEffect(() => {
    if (!showFinalPrompt || isScriptRunning) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle input if animation is complete and script is not running
      if (!showFinalPrompt || isScriptRunning) return;

      if (e.key === 'Enter') {
        // Execute command and move current input to completed lines
        e.preventDefault();
        const command = currentUserInput.trim();
        
        // Add to command history if not empty and different from last command
        if (command && (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== command)) {
          setCommandHistory(prev => [...prev, command]);
        }
        setHistoryIndex(-1); // Reset history index
        
        // Handle clear command separately - clears entire screen
        if (command === 'clear') {
          // Clear all displayed content but keep current directory
          setDisplayedCommand('');
          setDisplayedLines([]);
          setLoadingDotsLine0('');
          setLoadingDotsLine1('');
          setUserInputLines([]);
          setCommandOutputs([]);
          setCommandDirectories([]);
          setCurrentUserInput('');
          setGlowOpacity(1);
          setTextOpacity(1);
          // Do NOT reset directory - keep currentDirectory as is
          return;
        }
        
        // Get current directory from ref for synchronous access
        const currDir = currentDirectoryRef.current;
        
        // Handle script execution (./into-the-void.sh or into-the-void.sh)
        if (command === './into-the-void.sh' || command === 'into-the-void.sh' || command.endsWith('/into-the-void.sh')) {
          // Add to command history
          if (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== command) {
            setCommandHistory(prev => [...prev, command]);
          }
          setHistoryIndex(-1);
          
          // Add command to history
          setUserInputLines(prev => {
            const newLines = [...prev, command];
            // Run animation inline after state update
            setTimeout(() => {
              runAnimationInline(newLines.length - 1);
            }, 100);
            return newLines;
          });
          setCommandOutputs(prev => [...prev, []]);
          setCommandDirectories(prev => [...prev, currDir]);
          setCurrentUserInput('');
          
          return;
        }
        let output: string[] = [];
        let newDir = currDir;
        
        if (command) {
          // Check if it's executing a script (before executeCommandWithDir)
          const isScriptExecution = command === './into-the-void.sh' || 
                                   command === 'into-the-void.sh' || 
                                   command.endsWith('/into-the-void.sh') ||
                                   (command.startsWith('./') && command.endsWith('.sh'));
          
          if (isScriptExecution) {
            // Script execution is handled above, this shouldn't be reached
            // But if it is, return empty output
            output = [];
          } else {
            output = executeCommandWithDir(VIRTUAL_FS, command, currDir);
          }
          
          // Handle cd command directory change
          if (command.startsWith('cd ')) {
            const parts = command.split(/\s+/);
            const cdPath = parts[1];
            if (!cdPath || cdPath === '~') {
              newDir = '~';
            } else {
              const target = resolvePathWithDir(VIRTUAL_FS, cdPath, currDir);
              if (target && target.type === 'directory') {
                if (cdPath === '..') {
                  if (currDir === '~' || currDir === '/') {
                    newDir = '~';
                  } else {
                    const dirParts = currDir.replace(/^~/, '').replace(/^\//, '').split('/').filter((p: string) => p);
                    dirParts.pop();
                    newDir = dirParts.length > 0 ? '~/' + dirParts.join('/') : '~';
                  }
                } else if (cdPath.startsWith('/')) {
                  newDir = cdPath;
                } else {
                  newDir = currDir === '~' ? `~/${cdPath}` : `${currDir}/${cdPath}`;
                }
              }
            }
          }
        } else {
          output = [''];
        }
        
        // Update all state synchronously
        setUserInputLines(prev => [...prev, command]);
        setCommandOutputs(prev => [...prev, output]);
        setCommandDirectories(prev => [...prev, currDir]); // Store directory at time of command
        setCurrentUserInput('');
        if (newDir !== currDir) {
          currentDirectoryRef.current = newDir;
          setCurrentDirectory(newDir);
        }
      } else if (e.key === 'Backspace') {
        // Remove last character
        e.preventDefault();
        setCurrentUserInput(prev => prev.slice(0, -1));
        // Reset history index when user types/edits
        setHistoryIndex(-1);
      } else if (e.key === 'ArrowUp') {
        // Navigate backward in command history
        e.preventDefault();
        if (commandHistory.length > 0) {
          setHistoryIndex(prevIndex => {
            if (prevIndex === -1) {
              // Starting from current input, save it temporarily
              savedInputRef.current = currentUserInput;
              return commandHistory.length - 1;
            } else if (prevIndex > 0) {
              return prevIndex - 1;
            }
            return prevIndex; // Already at beginning
          });
        }
      } else if (e.key === 'ArrowDown') {
        // Navigate forward in command history
        e.preventDefault();
        setHistoryIndex(prevIndex => {
          if (prevIndex === -1) {
            return -1; // Already at bottom (current input)
          } else if (prevIndex < commandHistory.length - 1) {
            return prevIndex + 1;
          } else {
            // Reached the end, restore saved input
            return -1;
          }
        });
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Add printable character
        e.preventDefault();
        setCurrentUserInput(prev => prev + e.key);
        // Reset history index when user types/edits
        setHistoryIndex(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFinalPrompt, currentUserInput, currentDirectory, runAnimationInline, isScriptRunning, commandHistory, historyIndex]);
  
  // Update currentUserInput when history index changes
  useEffect(() => {
    if (historyIndex === -1) {
      // At bottom of history - restore saved input or keep empty
      setCurrentUserInput(savedInputRef.current);
      savedInputRef.current = '';
    } else if (historyIndex >= 0 && historyIndex < commandHistory.length) {
      // Set input to the command at this history index
      setCurrentUserInput(commandHistory[historyIndex]);
    }
  }, [historyIndex, commandHistory]);

  // Determine cursor visibility and blink state
  const isIdle = displayedCommand === COMMAND_PREFIX && displayedLines.length === 0;
  const inFadePhase = textOpacity < 1;

  // Cursor blinks during idle phase or in final prompt
  const shouldBlinkCursor = cursorBlink && (isIdle || showFinalPrompt);

  return (
    <Container className={jetbrainsMono.variable}>
      <GlowOverlay $opacity={glowOpacity} />
      <FilmGrain />
      <ScrollContainer>
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
            {userInputLines.map((line, index) => {
              const outputForThisCommand = commandOutputs[index] || [''];
              const commandDir = commandDirectories[index] || '~';
              // Use the directory that was active when the command was executed
              const prompt = commandDir === '~' ? COMMAND_PREFIX : `anon@stu202:${commandDir}$ `;
              
              return (
                <React.Fragment key={`command-${index}`}>
                  <Line>
                    {prompt}
                    {line}
                  </Line>
                  {outputForThisCommand.map((output, outIndex) => {
                    // Parse ls output to style directories, files, and executables differently
                    if (output.startsWith('__LS_')) {
                      const match = output.match(/^__LS_(directory|file|executable)__(.+)$/);
                      if (match) {
                        const [, type, name] = match;
                        return (
                          <Line key={`output-${index}-${outIndex}`}>
                            {type === 'directory' ? (
                              <DirectoryName>{name}</DirectoryName>
                            ) : type === 'executable' ? (
                              <ExecutableName>{name}</ExecutableName>
                            ) : (
                              <FileName>{name}</FileName>
                            )}
                          </Line>
                        );
                      }
                    }
                    return (
                      <Line key={`output-${index}-${outIndex}`}>
                        {output}
                      </Line>
                    );
                  })}
                </React.Fragment>
              );
            })}
            {!isScriptRunning && (
              <Line>
                {currentDirectory === '~' ? COMMAND_PREFIX : `anon@stu202:${currentDirectory}$ `}
                {currentUserInput}
                <Cursor $shouldBlink={shouldBlinkCursor} />
              </Line>
            )}
            <div ref={contentEndRef} />
          </>
        )}
      </Content>
      </ScrollContainer>
    </Container>
  );
}
