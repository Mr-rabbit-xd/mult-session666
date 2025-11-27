const { Module } = require('../lib/plugins');

// Fancy Text Generator
Module({
    command: 'fancy',
    package: 'converter',
    description: 'Convert text to fancy styles'
})(async (message, match) => {
    try {
        if (!match) {
            return await message.sendReply("✨ *FANCY TEXT GENERATOR* ✨\n\nUsage: .fancy your text here\n\nExample: .fancy Hello World");
        }

        const text = match;
        const styles = {
            "𝗕𝗼𝗹𝗱": text.replace(/[a-zA-Z0-9]/g, char => {
                if (char >= 'a' && char <= 'z') return String.fromCharCode(0x1D5EE + char.charCodeAt(0) - 97);
                if (char >= 'A' && char <= 'Z') return String.fromCharCode(0x1D5D4 + char.charCodeAt(0) - 65);
                if (char >= '0' && char <= '9') return String.fromCharCode(0x1D7EC + char.charCodeAt(0) - 48);
                return char;
            }),
            "𝘐𝘵𝘢𝘭𝘪𝘤": text.replace(/[a-zA-Z]/g, char => {
                if (char >= 'a' && char <= 'z') return String.fromCharCode(0x1D622 + char.charCodeAt(0) - 97);
                if (char >= 'A' && char <= 'Z') return String.fromCharCode(0x1D608 + char.charCodeAt(0) - 65);
                return char;
            }),
            "𝒮𝒸𝓇𝒾𝓅𝓉": text.replace(/[a-zA-Z]/g, char => {
                if (char >= 'a' && char <= 'z') return String.fromCharCode(0x1D4B6 + char.charCodeAt(0) - 97);
                if (char >= 'A' && char <= 'Z') return String.fromCharCode(0x1D49C + char.charCodeAt(0) - 65);
                return char;
            }),
            "𝔾𝕠𝕥𝕙𝕚𝕔": text.replace(/[a-zA-Z]/g, char => {
                if (char >= 'a' && char <= 'z') return String.fromCharCode(0x1D586 + char.charCodeAt(0) - 97);
                if (char >= 'A' && char <= 'Z') return String.fromCharCode(0x1D56C + char.charCodeAt(0) - 65);
                return char;
            }),
            "ᴛɪɴʏ ᴄᴀᴘꜱ": text.replace(/[a-zA-Z]/g, char => {
                const tiny = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ";
                if (char >= 'a' && char <= 'z') return tiny[char.charCodeAt(0) - 97];
                if (char >= 'A' && char <= 'Z') return tiny[char.charCodeAt(0) - 65];
                return char;
            }),
            "🅱🅻🅾🅲🅺🆂": text.replace(/[a-zA-Z]/g, char => {
                if (char >= 'a' && char <= 'z') return String.fromCharCode(0x1F170 + char.charCodeAt(0) - 97);
                if (char >= 'A' && char <= 'Z') return String.fromCharCode(0x1F170 + char.charCodeAt(0) - 65);
                return char;
            }).replace(/[0-9]/g, char => String.fromCharCode(0x1F1E6 + char.charCodeAt(0) - 48))
        };

        let result = "✨ *FANCY TEXT STYLES* ✨\n\n";
        result += `*Original:* ${text}\n\n`;

        for (const [styleName, styledText] of Object.entries(styles)) {
            result += `*${styleName}:* ${styledText}\n\n`;
        }

        result += "> © X-kira";

        await message.send(result);
    } catch (error) {
        console.error("❌ Error in .fancy command:", error);
        await message.sendReply("❌ *Error occurred while generating fancy text.*");
    }
});

// Bubble Text
Module({
    command: 'bubble',
    package: 'converter',
    description: 'Convert text to bubble letters'
})(async (message, match) => {
    try {
        if (!match) {
            return await message.sendReply("🫧 *BUBBLE TEXT* 🫧\n\nUsage: .bubble your text here\n\nExample: .bubble Hello");
        }

        const bubbleMap = {
            'a': 'ⓐ', 'b': 'ⓑ', 'c': 'ⓒ', 'd': 'ⓓ', 'e': 'ⓔ', 'f': 'ⓕ', 'g': 'ⓖ', 'h': 'ⓗ', 'i': 'ⓘ',
            'j': 'ⓙ', 'k': 'ⓚ', 'l': 'ⓛ', 'm': 'ⓜ', 'n': 'ⓝ', 'o': 'ⓞ', 'p': 'ⓟ', 'q': 'ⓠ', 'r': 'ⓡ',
            's': 'ⓢ', 't': 'ⓣ', 'u': 'ⓤ', 'v': 'ⓥ', 'w': 'ⓦ', 'x': 'ⓧ', 'y': 'ⓨ', 'z': 'ⓩ',
            'A': 'Ⓐ', 'B': 'Ⓑ', 'C': 'Ⓒ', 'D': 'Ⓓ', 'E': 'Ⓔ', 'F': 'Ⓕ', 'G': 'Ⓖ', 'H': 'Ⓗ', 'I': 'Ⓘ',
            'J': 'Ⓙ', 'K': 'Ⓚ', 'L': 'Ⓛ', 'M': 'Ⓜ', 'N': 'Ⓝ', 'O': 'Ⓞ', 'P': 'Ⓟ', 'Q': 'Ⓠ', 'R': 'Ⓡ',
            'S': 'Ⓢ', 'T': 'Ⓣ', 'U': 'Ⓤ', 'V': 'Ⓥ', 'W': 'Ⓦ', 'X': 'Ⓧ', 'Y': 'Ⓨ', 'Z': 'Ⓩ',
            '0': '⓪', '1': '①', '2': '②', '3': '③', '4': '④', '5': '⑤', '6': '⑥', '7': '⑦', '8': '⑧', '9': '⑨'
        };

        const bubbleText = match.split('').map(char => bubbleMap[char] || char).join('');

        await message.send(`🫧 *BUBBLE TEXT* 🫧\n\n*Original:* ${match}\n*Bubble:* ${bubbleText}\n\n> © X-kira`);
    } catch (error) {
        console.error("❌ Error in .bubble command:", error);
        await message.sendReply("❌ *Error occurred while generating bubble text.*");
    }
});

// Reverse Text
Module({
    command: 'reverse',
    package: 'converter',
    description: 'Reverse text'
})(async (message, match) => {
    try {
        const text = match || message.reply_message?.text;

        if (!text) {
            return await message.sendReply("🔄 *TEXT REVERSER* 🔄\n\nUsage: .reverse your text here\nOr reply to a message with .reverse");
        }

        const reversed = text.split('').reverse().join('');

        await message.send(`🔄 *TEXT REVERSER* 🔄\n\n*Original:* ${text}\n*Reversed:* ${reversed}\n\n> © X-kira`);
    } catch (error) {
        console.error("❌ Error in .reverse command:", error);
        await message.sendReply("❌ *Error occurred while reversing text.*");
    }
});

// Mock Text (SpongeBob style)
Module({
    command: 'mock',
    package: 'converter',
    description: 'Convert text to mocking SpongeBob style'
})(async (message, match) => {
    try {
        const text = match || message.reply_message?.text;

        if (!text) {
            return await message.sendReply("🤡 *MOCKING TEXT* 🤡\n\nUsage: .mock your text here\nOr reply to a message with .mock");
        }

        const mockText = text.split('').map((char, index) => {
            if (char.match(/[a-zA-Z]/)) {
                return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase();
            }
            return char;
        }).join('');

        await message.send(`🤡 *MOCKING SPONGEBOB* 🤡\n\n*Original:* ${text}\n*Mocked:* ${mockText}\n\n> © X-kira`);
    } catch (error) {
        console.error("❌ Error in .mock command:", error);
        await message.sendReply("❌ *Error occurred while mocking text.*");
    }
});

// Aesthetic Text
Module({
    command: 'aesthetic',
    package: 'converter',
    description: 'Convert text to aesthetic style'
})(async (message, match) => {
    try {
        if (!match) {
            return await message.sendReply("🌸 *AESTHETIC TEXT* 🌸\n\nUsage: .aesthetic your text here\n\nExample: .aesthetic love yourself");
        }

        const aesthetic = match.split('').join(' ').toUpperCase();
        const vaporwave = match.replace(/[a-zA-Z0-9]/g, char => {
            if (char >= 'a' && char <= 'z') return String.fromCharCode(0xFF41 + char.charCodeAt(0) - 97);
            if (char >= 'A' && char <= 'Z') return String.fromCharCode(0xFF21 + char.charCodeAt(0) - 65);
            if (char >= '0' && char <= '9') return String.fromCharCode(0xFF10 + char.charCodeAt(0) - 48);
            return char;
        });

        let result = "🌸 *AESTHETIC STYLES* 🌸\n\n";
        result += `*Original:* ${match}\n\n`;
        result += `*Spaced:* ${aesthetic}\n\n`;
        result += `*Vaporwave:* ${vaporwave}\n\n`;
        result += `*With Symbols:* ・❀・${match}・❀・\n\n`;
        result += `*Kawaii:* (◕‿◕) ${match} (◕‿◕)\n\n`;
        result += "> © X-kira";

        await message.send(result);
    } catch (error) {
        console.error("❌ Error in .aesthetic command:", error);
        await message.sendReply("❌ *Error occurred while generating aesthetic text.*");
    }
});

// Upside Down Text (NEW)
Module({
    command: 'upside',
    package: 'converter',
    description: 'Convert text to upside down'
})(async (message, match) => {
    try {
        if (!match) {
            return await message.sendReply("🙃 *UPSIDE DOWN TEXT* 🙃\n\nUsage: .upside your text here\n\nExample: .upside Hello World");
        }

        const flipMap = {
            'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ', 'i': 'ᴉ',
            'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u', 'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ',
            's': 's', 't': 'ʇ', 'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
            'A': '∀', 'B': 'q', 'C': 'Ɔ', 'D': 'p', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': '⅁', 'H': 'H', 'I': 'I',
            'J': 'ſ', 'K': 'ʞ', 'L': '˥', 'M': 'W', 'N': 'N', 'O': 'O', 'P': 'Ԁ', 'Q': 'Ὸ', 'R': 'ɹ',
            'S': 'S', 'T': '┴', 'U': '∩', 'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z',
            '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ', '8': '8', '9': '6', '0': '0',
            '!': '¡', '?': '¿', '.': '˙', ',': '\'', '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{'
        };

        const upsideText = match.split('').map(char => flipMap[char] || char).reverse().join('');

        await message.send(`🙃 *UPSIDE DOWN TEXT* 🙃\n\n*Original:* ${match}\n*Upside Down:* ${upsideText}\n\n> © X-kira`);
    } catch (error) {
        console.error("❌ Error in .upside command:", error);
        await message.sendReply("❌ *Error occurred while flipping text.*");
    }
});

// Strikethrough Text (NEW)
Module({
    command: 'strike',
    package: 'converter',
    description: 'Convert text to strikethrough'
})(async (message, match) => {
    try {
        if (!match) {
            return await message.sendReply("~~STRIKETHROUGH TEXT~~\n\nUsage: .strike your text here\n\nExample: .strike Hello World");
        }

        const strikeText = match.split('').map(char => char + '\u0336').join('');

        await message.send(`*STRIKETHROUGH TEXT*\n\n*Original:* ${match}\n*Strike:* ${strikeText}\n\n> © X-kira`);
    } catch (error) {
        console.error("❌ Error in .strike command:", error);
        await message.sendReply("❌ *Error occurred while creating strikethrough text.*");
    }
});

// Monospace Text (NEW)
Module({
    command: 'mono',
    package: 'converter',
    description: 'Convert text to monospace'
})(async (message, match) => {
    try {
        if (!match) {
            return await message.sendReply("𝙼𝙾𝙽𝙾𝚂𝙿𝙰𝙲𝙴 𝚃𝙴𝚇𝚃\n\nUsage: .mono your text here\n\nExample: .mono Hello World");
        }

        const monoText = match.replace(/[a-zA-Z0-9]/g, char => {
            if (char >= 'a' && char <= 'z') return String.fromCharCode(0x1D68A + char.charCodeAt(0) - 97);
            if (char >= 'A' && char <= 'Z') return String.fromCharCode(0x1D670 + char.charCodeAt(0) - 65);
            if (char >= '0' && char <= '9') return String.fromCharCode(0x1D7F6 + char.charCodeAt(0) - 48);
            return char;
        });

        await message.send(`𝙼𝙾𝙽𝙾𝚂𝙿𝙰𝙲𝙴 𝚃𝙴𝚇𝚃\n\n*Original:* ${match}\n*Monospace:* ${monoText}\n\n> © X-kira`);
    } catch (error) {
        console.error("❌ Error in .mono command:", error);
        await message.sendReply("❌ *Error occurred while creating monospace text.*");
    }
});

// Cursed/Zalgo Text (NEW)
Module({
    command: 'cursed',
    package: 'converter',
    description: 'Convert text to cursed/zalgo style'
})(async (message, match) => {
    try {
        if (!match) {
            return await message.sendReply("👻 *CURSED TEXT* 👻\n\nUsage: .cursed your text here\n\nExample: .cursed Hello");
        }

        const zalgoUp = ['̍', '̎', '̄', '̅', '̿', '̑', '̆', '̐', '͒', '͗', '͑', '̇', '̈', '̊', '͂', '̓', '̈́', '͊', '͋', '͌', '̃', '̂', '̌'];
        const zalgoMid = ['̕', '̛', '̀', '́', '͘', '̡', '̢', '̧', '̨', '̴', '̵', '̶', '͏', '͜', '͝', '͞', '͟', '͠', '͢', '̸', '̷', '͡'];
        const zalgoDown = ['̖', '̗', '̘', '̙', '̜', '̝', '̞', '̟', '̠', '̤', '̥', '̦', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '̹', '̺', '̻', '̼', 'ͅ', '͇', '͈', '͉', '͍', '͎', '͓', '͔', '͕', '͖', '͙', '͚', '̣'];

        const cursedText = match.split('').map(char => {
            let cursed = char;
            for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
                cursed += zalgoUp[Math.floor(Math.random() * zalgoUp.length)];
            }
            for (let i = 0; i < Math.floor(Math.random() * 2) + 1; i++) {
                cursed += zalgoMid[Math.floor(Math.random() * zalgoMid.length)];
            }
            for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
                cursed += zalgoDown[Math.floor(Math.random() * zalgoDown.length)];
            }
            return cursed;
        }).join('');

        await message.send(`👻 *CURSED TEXT* 👻\n\n*Original:* ${match}\n*Cursed:* ${cursedText}\n\n> © X-kira`);
    } catch (error) {
        console.error("❌ Error in .cursed command:", error);
        await message.sendReply("❌ *Error occurred while creating cursed text.*");
    }
});

// Wide Text (NEW)
Module({
    command: 'wide',
    package: 'converter',
    description: 'Convert text to wide/fullwidth style'
})(async (message, match) => {
    try {
        if (!match) {
            return await message.sendReply("ＷＩＤＥ ＴＥＸＴ\n\nUsage: .wide your text here\n\nExample: .wide Hello World");
        }

        const wideText = match.replace(/[!-~]/g, char => {
            return String.fromCharCode(char.charCodeAt(0) + 0xFEE0);
        }).replace(/ /g, '　');

        await message.send(`ＷＩＤＥ ＴＥＸＴ\n\n*Original:* ${match}\n*Wide:* ${wideText}\n\n> © X-kira`);
    } catch (error) {
        console.error("❌ Error in .wide command:", error);
        await message.sendReply("❌ *Error occurred while creating wide text.*");
    }
});