from typing import Optional

import ctranslate2
from transformers import AutoTokenizer

from config import NLLB_LANG_CODES
from model_setup import ensure_nllb_model


class TranslateEngine:
    def __init__(self) -> None:
        self.translator: Optional[ctranslate2.Translator] = None
        self.tokenizer: Optional[AutoTokenizer] = None

    def load(self) -> None:
        model_dir = ensure_nllb_model()
        self.translator = ctranslate2.Translator(
            str(model_dir),
            device="cpu",
            compute_type="int8",
        )
        self.tokenizer = AutoTokenizer.from_pretrained(
            "facebook/nllb-200-distilled-600M"
        )

    def translate(
        self,
        source_text: str,
        source_lang: str,
        target_lang: str,
    ) -> str:
        if not self.translator or not self.tokenizer:
            raise RuntimeError("Translation model is not loaded")

        source_code = NLLB_LANG_CODES[source_lang]
        target_code = NLLB_LANG_CODES[target_lang]
        self.tokenizer.src_lang = source_code
        token_ids = self.tokenizer.encode(source_text)
        source_tokens = self.tokenizer.convert_ids_to_tokens(token_ids)
        target_prefix = [self.tokenizer.convert_tokens_to_ids(target_code)]
        results = self.translator.translate_batch(
            [source_tokens],
            target_prefix=[target_prefix],
            beam_size=1,
            max_decoding_length=128,
        )
        translated_ids = self.tokenizer.convert_tokens_to_ids(
            results[0].hypotheses[0]
        )
        return self.tokenizer.decode(translated_ids, skip_special_tokens=True).strip()
