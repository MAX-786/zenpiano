import { useState, useEffect, useCallback } from 'react';

export const useMidi = () => {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [inputs, setInputs] = useState<MIDIInput[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    const { data } = event;
    if (!data) return;

    const [command, note, velocity] = data;
    // Note On (144) with velocity > 0
    if (command === 144 && velocity > 0) {
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.add(note);
        return newSet;
      });
    }
    // Note Off (128) or Note On with velocity 0
    else if (command === 128 || (command === 144 && velocity === 0)) {
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(note);
        return newSet;
      });
    }
  }, []);

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setError("Web MIDI API is not supported in this browser.");
      return;
    }

    navigator.requestMIDIAccess().then(
      (access) => {
        setMidiAccess(access);
        const inputList: MIDIInput[] = [];
        access.inputs.forEach((input) => {
          inputList.push(input);
          input.onmidimessage = handleMidiMessage;
        });
        setInputs(inputList);

        access.onstatechange = (e) => {
           // simple refresh logic could go here
           const event = e as MIDIConnectionEvent;
           console.log("MIDI State Change:", event.port.name, event.port.state);
        };
      },
      () => {
        setError("Could not access MIDI devices.");
      }
    );
  }, [handleMidiMessage]);

  return { activeNotes, inputs, error, midiAccess };
};