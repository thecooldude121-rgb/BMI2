import React, { useState, useEffect } from 'react';
import { Plus, Play, Mail, Phone, Calendar, Clock, Send, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const STEP_TYPES = {
  email: { icon: Mail, color: 'bg-blue-500', label: 'Email' },
  sms: { icon: MessageSquare, color: 'bg-green-500', label: 'SMS' },
  whatsapp: { icon: Send, color: 'bg-emerald-500', label: 'WhatsApp' },
  call: { icon: Phone, color: 'bg-purple-500', label: 'Call' },
  wait: { icon: Clock, color: 'bg-gray-500', label: 'Wait' },
  meeting: { icon: Calendar, color: 'bg-amber-500', label: 'Meeting' }
};

export const SequenceBuilder = ({ sequenceId }: { sequenceId?: string }) => {
  const [sequence, setSequence] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sequenceId) loadSequence();
    else createNew();
  }, [sequenceId]);

  const loadSequence = async () => {
    const { data: seq } = await supabase.from('sequences').select('*').eq('id', sequenceId).single();
    const { data: stps } = await supabase.from('sequence_steps').select('*').eq('sequence_id', sequenceId).order('step_number');
    setSequence(seq);
    setSteps(stps || []);
    setLoading(false);
  };

  const createNew = async () => {
    const { data } = await supabase.from('sequences').insert([{ name: 'New Sequence', status: 'draft' }]).select().single();
    setSequence(data);
    setLoading(false);
  };

  const addStep = async (type: string) => {
    if (!sequence) return;
    const { data } = await supabase.from('sequence_steps').insert([{
      sequence_id: sequence.id,
      step_number: steps.length + 1,
      step_type: type,
      name: `${STEP_TYPES[type as keyof typeof STEP_TYPES].label} ${steps.length + 1}`,
      content: {},
      delay_config: {}
    }]).select().single();
    setSteps([...steps, data]);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center mb-4">
          <input value={sequence?.name || ''} onChange={(e) => setSequence({...sequence, name: e.target.value})} className="text-2xl font-bold" />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg"><Play className="h-4 w-4 inline mr-2" />Publish</button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg"><p className="text-xs text-blue-600">Steps</p><p className="text-xl font-bold text-blue-700">{steps.length}</p></div>
          <div className="bg-green-50 p-3 rounded-lg"><p className="text-xs text-green-600">Active</p><p className="text-xl font-bold text-green-700">0</p></div>
          <div className="bg-purple-50 p-3 rounded-lg"><p className="text-xs text-purple-600">Completed</p><p className="text-xl font-bold text-purple-700">0</p></div>
          <div className="bg-amber-50 p-3 rounded-lg"><p className="text-xs text-amber-600">Response</p><p className="text-xl font-bold text-amber-700">0%</p></div>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-white border-r p-4">
          <h3 className="text-sm font-semibold uppercase mb-3">Add Steps</h3>
          <div className="space-y-2">
            {Object.entries(STEP_TYPES).map(([key, config]) => {
              const Icon = config.icon;
              return <button key={key} onClick={() => addStep(key)} className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50"><div className={`${config.color} rounded-lg p-2`}><Icon className="h-4 w-4 text-white" /></div><span className="text-sm font-medium">{config.label}</span></button>;
            })}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            {steps.map((step, i) => {
              const Icon = STEP_TYPES[step.step_type as keyof typeof STEP_TYPES]?.icon || Mail;
              const color = STEP_TYPES[step.step_type as keyof typeof STEP_TYPES]?.color || 'bg-blue-500';
              return <div key={step.id} className="mb-4"><div className="flex items-start space-x-4"><div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">{step.step_number}</div><div className="flex-1 bg-white border-2 rounded-lg p-4 hover:border-blue-500"><div className="flex items-start space-x-3"><div className={`${color} rounded-lg p-2`}><Icon className="h-5 w-5 text-white" /></div><div><h4 className="font-semibold">{step.name}</h4></div></div></div></div>{i < steps.length - 1 && <div className="ml-4 h-4 w-0.5 bg-gray-300" />}</div>;
            })}
            {steps.length === 0 && <div className="text-center py-12"><Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-semibold">Start Building</h3><p className="text-gray-600">Add your first step</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequenceBuilder;
