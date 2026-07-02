import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {TranslationSentences} from '../types/StreamingTypes';
import {RoomState} from '../types/RoomState';
import Blink from '../Blink';
import {CURSOR_BLINK_INTERVAL_MS} from '../cursorBlinkInterval';
import {ru} from '../i18n/ru';

type StreamingTranscriptProps = {
  isSpeaker: boolean;
  animateTextDisplay: boolean;
  roomState: RoomState | null;
  translationSentences: TranslationSentences;
  lastTranslationResultRef: React.RefObject<HTMLDivElement | null>;
  onClearTranscriptForAll: () => void;
};

export function StreamingTranscript({
  isSpeaker,
  animateTextDisplay,
  roomState,
  translationSentences,
  lastTranslationResultRef,
  onClearTranscriptForAll,
}: StreamingTranscriptProps) {
  return (
    <div className="translation-text-container-sra horizontal-padding-sra">
      <Stack
        direction="row"
        spacing={2}
        sx={{mb: '16px', alignItems: 'center'}}>
        <Typography variant="h1" sx={{fontWeight: 700, flexGrow: 1}}>
          {ru.transcript}
        </Typography>
        {isSpeaker && (
          <Button variant="text" size="small" onClick={onClearTranscriptForAll}>
            {ru.clearTranscript}
          </Button>
        )}
      </Stack>
      <Stack direction="row">
        <div className="translation-text-sra">
          {translationSentences.map((sentence, index, arr) => {
            const isLast = index === arr.length - 1;
            const maybeRef = isLast ? {ref: lastTranslationResultRef} : {};
            return (
              <div className="text-chunk-sra" key={index} {...maybeRef}>
                <Typography variant="body1">
                  {sentence}
                  {animateTextDisplay && isLast && (
                    <Blink
                      intervalMs={CURSOR_BLINK_INTERVAL_MS}
                      shouldBlink={(roomState?.activeTranscoders ?? 0) > 0}>
                      <Typography
                        component="span"
                        variant="body1"
                        sx={{
                          display: 'inline-block',
                          transform: 'scaleY(1.25) translateY(-1px)',
                        }}>
                        {'|'}
                      </Typography>
                    </Blink>
                  )}
                </Typography>
              </div>
            );
          })}
        </div>
      </Stack>
    </div>
  );
}
