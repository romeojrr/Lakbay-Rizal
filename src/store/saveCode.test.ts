// FR-85 (SRS v2.3 §3.9): save codes round-trip exactly; bad codes change nothing.
import { afterEach, describe, expect, it } from 'vitest';
import { realContent } from '../test/content';
import { initialProgress, PROGRESS_KEYS, useProgress, type Progress } from './progress';
import { checksum, decodeSave, encodeSave } from './saveCode';

const content = realContent();
const saved = (): Progress =>
  Object.fromEntries(
    PROGRESS_KEYS.map((k) => [k, useProgress.getState()[k]]),
  ) as unknown as Progress;

afterEach(() => useProgress.setState(initialProgress()));

describe('save code (§3.9)', () => {
  it('export → reset → import restores the progress exactly', () => {
    const berlin = content.stops.find((s) => s.id === 'berlin-1887');
    if (!berlin) throw new Error('berlin');
    useProgress.getState().complete(berlin);
    useProgress.setState({
      xp: 455,
      streak: 3,
      bestStreak: 7,
      stampGrade: { 'berlin-1887': 'gold' },
      achievements: ['first-steps'],
      readIn: { 'berlin-1887': ['en', 'fil'] },
      certificateName: 'Juana dela Cruz',
      settings: { ...initialProgress().settings, textSize: 'large', lang: 'fil' },
    });
    const before = saved();
    const code = encodeSave(useProgress.getState());
    expect(code).toMatch(/^LR3\.[A-Za-z0-9_-]+\.[0-9A-Z]{4}$/);

    useProgress.getState().reset();
    expect(saved()).not.toEqual(before);

    const result = decodeSave(code);
    if (!('progress' in result)) throw new Error(result.error);
    useProgress.setState(result.progress);
    expect(saved()).toEqual(before);
  });

  it('accepts the code with spaces and line breaks (copied from a file or a chat)', () => {
    const code = encodeSave(useProgress.getState());
    const broken = `  ${code.slice(0, 20)}\n${code.slice(20)}  `;
    expect('progress' in decodeSave(broken)).toBe(true);
  });

  it('rejects empty, garbled, changed and newer codes', () => {
    const code = encodeSave(useProgress.getState());
    expect(decodeSave('   ')).toEqual({ error: 'empty' });
    expect(decodeSave('hello world')).toEqual({ error: 'format' });
    const [prefix, payload = '', sum] = code.split('.');
    const changed = `${prefix}.${payload.slice(0, -2)}AA.${sum}`;
    expect(decodeSave(changed)).toEqual({ error: 'checksum' });
    expect(decodeSave(`LR9.${payload}.${sum}`)).toEqual({ error: 'newer' });
    const junk = 'bm90IGpzb24';
    expect(decodeSave(`LR3.${junk}.${checksum(junk)}`)).toEqual({ error: 'damaged' });
  });

  it('upgrades a code saved by an older version', () => {
    const v1 = { ...initialProgress(), version: 1, stamps: ['calamba-1861'] } as Record<
      string,
      unknown
    >;
    delete v1.xp;
    const payload = btoa(JSON.stringify(v1))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const result = decodeSave(`LR1.${payload}.${checksum(payload)}`);
    expect('progress' in result && result.progress).toMatchObject({
      version: 3,
      stamps: ['calamba-1861'],
      xp: 0,
    });
  });
});
