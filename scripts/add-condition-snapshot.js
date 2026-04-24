const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ===== TAG CONFIGURATION =====
const TAG_LABELS = {
  heart: 'Heart & Cardiovascular',
  lung: 'Lung & Respiratory',
  brain: 'Brain & Nervous System',
  metabolism: 'Metabolism & Endocrine',
  'bone-joint': 'Bone, Joint & Muscle',
  reproductive: 'Reproductive Health',
  dental: 'Oral & Dental Health',
  immune: 'Immune & Infectious',
  fitness: 'Fitness & Performance',
  substance: 'Substance Monitoring'
};

const TAG_COLORS = {
  heart: '#DC2626',
  lung: '#0891B2',
  brain: '#7C3AED',
  metabolism: '#D97706',
  'bone-joint': '#059669',
  reproductive: '#DB2777',
  dental: '#0D9488',
  immune: '#2563EB',
  fitness: '#EA580C',
  substance: '#6366F1'
};

// ===== CONDITION DATABASE =====
const DB = {
  'afib-blood-pressure-monitor': {
    tag: 'heart',
    name: 'Atrial Fibrillation (AFib)',
    brief: 'Atrial fibrillation is the most common serious heart rhythm disorder, where the heart\u2019s upper chambers beat irregularly and often too fast. This can lead to blood clots, stroke, and heart failure if left unmanaged.',
    stats: [
      { value: '6M+', label: 'Americans living with AFib' },
      { value: '5\u00d7', label: 'Higher risk of stroke vs. general population' },
      { value: '30%', label: 'Of cases are asymptomatic (\u201csilent AFib\u201d)' }
    ]
  },
  'alcohol-breathalyzers': {
    tag: 'substance',
    name: 'Alcohol Use & Monitoring',
    brief: 'Alcohol misuse is a leading preventable cause of death worldwide. Chronic heavy drinking damages the liver, brain, heart, and immune system. Regular monitoring helps individuals track intake and support recovery.',
    stats: [
      { value: '29M', label: 'Americans with alcohol use disorder' },
      { value: '95K', label: 'Alcohol-related deaths per year in the U.S.' },
      { value: '#3', label: 'Preventable cause of death in the United States' }
    ]
  },
  'anxiety-breathing-trainers': {
    tag: 'brain',
    name: 'Anxiety & Stress Disorders',
    brief: 'Anxiety disorders are the most common mental health condition, involving persistent excessive worry, fear, or nervousness that interferes with daily life. Controlled breathing is one of the most evidence-based self-management techniques.',
    stats: [
      { value: '40M', label: 'U.S. adults affected each year' },
      { value: '19%', label: 'Of the adult population — most common mental illness' },
      { value: '37%', label: 'Receive treatment (majority go untreated)' }
    ]
  },
  'anxiety-massagers': {
    tag: 'brain',
    name: 'Anxiety & Muscle Tension',
    brief: 'Chronic anxiety triggers a persistent stress response that causes muscle tension, headaches, and physical discomfort. Therapeutic massage helps break the anxiety-tension cycle by activating the parasympathetic nervous system.',
    stats: [
      { value: '40M', label: 'U.S. adults with anxiety disorders' },
      { value: '70%', label: 'Of anxiety sufferers report chronic muscle tension' },
      { value: '60%', label: 'Report improvement with regular massage therapy' }
    ]
  },
  'arthritis-gloves': {
    tag: 'bone-joint',
    name: 'Arthritis (Osteoarthritis & Rheumatoid)',
    brief: 'Arthritis is a group of conditions causing joint inflammation, pain, and stiffness. Osteoarthritis (wear-and-tear) is the most common form, while rheumatoid arthritis is an autoimmune disease attacking joint linings.',
    stats: [
      { value: '58M', label: 'Americans diagnosed with arthritis' },
      { value: '#1', label: 'Cause of work disability in the United States' },
      { value: '1 in 4', label: 'U.S. adults have some form of arthritis' }
    ]
  },
  'arthritis-tens': {
    tag: 'bone-joint',
    name: 'Arthritis Pain Management',
    brief: 'Arthritis pain ranges from mild discomfort to debilitating chronic pain. TENS (Transcutaneous Electrical Nerve Stimulation) therapy provides drug-free pain relief by sending low-voltage electrical impulses that block pain signals.',
    stats: [
      { value: '58M', label: 'Americans living with arthritis' },
      { value: '44%', label: 'Report activity limitations due to pain' },
      { value: '$304B', label: 'Annual economic burden in the U.S.' }
    ]
  },
  'asthma-pulse-oximeter': {
    tag: 'lung',
    name: 'Asthma',
    brief: 'Asthma is a chronic lung disease that inflames and narrows the airways, causing recurring episodes of wheezing, breathlessness, chest tightness, and coughing. It can range from mild to life-threatening.',
    stats: [
      { value: '25M', label: 'Americans currently living with asthma' },
      { value: '7.7%', label: 'Of the U.S. population affected' },
      { value: '3,500+', label: 'Asthma-related deaths per year in the U.S.' }
    ]
  },
  'athletic-body-composition': {
    tag: 'fitness',
    name: 'Athletic Body Composition',
    brief: 'Body composition \u2014 the ratio of fat, muscle, bone, and water \u2014 is a far more meaningful fitness metric than body weight alone. Athletes use body composition tracking to optimize performance, recovery, and training periodization.',
    stats: [
      { value: '10\u201320%', label: 'Ideal body fat range for male athletes' },
      { value: '18\u201328%', label: 'Ideal body fat range for female athletes' },
      { value: '2\u00d7', label: 'More predictive of performance than BMI alone' }
    ]
  },
  'athletic-breathing': {
    tag: 'fitness',
    name: 'Respiratory Training for Athletes',
    brief: 'Respiratory muscle training strengthens the diaphragm and intercostal muscles, improving oxygen delivery, reducing perceived exertion, and enhancing endurance performance across all sports and fitness levels.',
    stats: [
      { value: '15%', label: 'Average endurance improvement with breathing training' },
      { value: '12%', label: 'Reduction in perceived exertion during exercise' },
      { value: '4\u20136 wks', label: 'Typical time to see measurable benefits' }
    ]
  },
  'back-pain-tens': {
    tag: 'bone-joint',
    name: 'Back Pain (TENS Therapy)',
    brief: 'Back pain is one of the most common reasons people seek medical care or miss work. TENS units deliver low-voltage electrical currents that interrupt pain signals, providing drug-free relief for both acute and chronic back pain.',
    stats: [
      { value: '65M', label: 'Americans report a recent episode of back pain' },
      { value: '80%', label: 'Of adults experience back pain in their lifetime' },
      { value: '#1', label: 'Global cause of years lived with disability' }
    ]
  },
  'back-support-braces': {
    tag: 'bone-joint',
    name: 'Back Pain & Spinal Support',
    brief: 'Back pain affects the lower (lumbar), middle (thoracic), or upper (cervical) spine. Support braces help stabilize the spine, improve posture, and reduce strain during daily activities and recovery from injury.',
    stats: [
      { value: '65M', label: 'Americans with recent back pain' },
      { value: '$12B', label: 'Spent annually on back pain treatment in the U.S.' },
      { value: '39%', label: 'Of cases involve the lower back (lumbar)' }
    ]
  },
  'bariatric-body-composition': {
    tag: 'metabolism',
    name: 'Bariatric Surgery Follow-Up',
    brief: 'Bariatric (weight loss) surgery is a life-changing procedure for severe obesity. Post-surgical body composition monitoring is critical to ensure patients are losing fat \u2014 not muscle \u2014 and maintaining adequate nutrition during rapid weight loss.',
    stats: [
      { value: '250K+', label: 'Bariatric surgeries performed annually in the U.S.' },
      { value: '60\u201380%', label: 'Of excess weight typically lost within 1\u20132 years' },
      { value: '30%', label: 'Of post-surgical weight loss can be lean mass without monitoring' }
    ]
  },
  'bcaa-glutamine-supplements': {
    tag: 'fitness',
    name: 'Muscle Recovery & BCAAs',
    brief: 'Branched-chain amino acids (BCAAs) and glutamine are essential for muscle protein synthesis, recovery, and immune function. Supplementation may reduce muscle soreness, accelerate recovery, and prevent muscle breakdown during intense training.',
    stats: [
      { value: '20\u201330%', label: 'Of muscle protein is made up of BCAAs' },
      { value: '30%', label: 'Reduction in exercise-induced muscle damage reported' },
      { value: '$6B+', label: 'Global sports nutrition supplement market' }
    ]
  },
  'cholesterol': {
    tag: 'heart',
    name: 'High Cholesterol',
    brief: 'High cholesterol is a \u201csilent\u201d condition where excess LDL (bad cholesterol) builds up in artery walls, forming plaques that restrict blood flow and dramatically increase the risk of heart attack and stroke.',
    stats: [
      { value: '86M', label: 'U.S. adults with high total cholesterol' },
      { value: '1 in 3', label: 'American adults have elevated LDL levels' },
      { value: '0', label: 'Symptoms until a heart attack or stroke occurs' }
    ]
  },
  'cognitive-decline-monitoring': {
    tag: 'brain',
    name: 'Cognitive Decline & Brain Health',
    brief: 'Cognitive decline is the gradual loss of memory, thinking, and reasoning abilities. While some decline is normal with aging, accelerated decline may signal Alzheimer\u2019s disease or other dementias. Early detection is key to slowing progression.',
    stats: [
      { value: '6.7M', label: 'Americans living with Alzheimer\u2019s disease' },
      { value: '1 in 9', label: 'Adults age 65+ have Alzheimer\u2019s dementia' },
      { value: '$355B', label: 'Annual cost of dementia care in the U.S.' }
    ]
  },
  'colorectal-cancer-screening': {
    tag: 'immune',
    name: 'Colorectal Cancer',
    brief: 'Colorectal cancer is the third most commonly diagnosed cancer and the second leading cause of cancer death in the U.S. Regular screening can detect precancerous polyps before they become malignant, making it one of the most preventable cancers.',
    stats: [
      { value: '150K', label: 'New colorectal cancer cases per year in the U.S.' },
      { value: '#2', label: 'Leading cause of cancer death (combined sexes)' },
      { value: '90%', label: 'Survival rate when caught early through screening' }
    ]
  },
  'copd-breathing-trainers': {
    tag: 'lung',
    name: 'COPD (Breathing Rehabilitation)',
    brief: 'Chronic Obstructive Pulmonary Disease (COPD) progressively restricts airflow, making breathing increasingly difficult. Breathing trainers strengthen respiratory muscles, improve lung capacity, and reduce shortness of breath in daily activities.',
    stats: [
      { value: '16M', label: 'Americans diagnosed with COPD' },
      { value: 'Millions', label: 'More are undiagnosed and untreated' },
      { value: '#4', label: 'Leading cause of death in the United States' }
    ]
  },
  'copd-pulse-oximeters': {
    tag: 'lung',
    name: 'COPD (Oxygen Monitoring)',
    brief: 'COPD damages the lungs\u2019 ability to transfer oxygen into the blood. Home pulse oximetry monitoring helps COPD patients detect dangerous drops in blood oxygen levels before symptoms become severe.',
    stats: [
      { value: '16M', label: 'Americans diagnosed with COPD' },
      { value: '380M', label: 'People affected worldwide' },
      { value: '<88%', label: 'SpO\u2082 level that requires supplemental oxygen' }
    ]
  },
  'coronary-artery-disease-bp-monitor': {
    tag: 'heart',
    name: 'Coronary Artery Disease (CAD)',
    brief: 'Coronary artery disease occurs when cholesterol plaques build up inside the heart\u2019s arteries, reducing blood flow to the heart muscle. It\u2019s the most common type of heart disease and the leading cause of death in the U.S.',
    stats: [
      { value: '20M', label: 'Americans living with CAD' },
      { value: '#1', label: 'Cause of death in the United States' },
      { value: '805K', label: 'Heart attacks per year in the U.S.' }
    ]
  },
  'creatine-supplements': {
    tag: 'fitness',
    name: 'Muscle Building & Creatine',
    brief: 'Creatine is the most researched and effective sports supplement for increasing muscle strength, power output, and lean mass. It works by replenishing ATP (your muscles\u2019 primary energy source) during high-intensity exercise.',
    stats: [
      { value: '#1', label: 'Most researched sports performance supplement' },
      { value: '5\u201310%', label: 'Average strength gain with creatine supplementation' },
      { value: '1\u20132kg', label: 'Typical lean mass gain in 4\u201312 weeks' }
    ]
  },
  'dementia-alzheimers-gps-alert': {
    tag: 'brain',
    name: 'Dementia & Alzheimer\u2019s Disease',
    brief: 'Dementia is a progressive decline in cognitive function severe enough to interfere with daily life. Alzheimer\u2019s disease accounts for 60\u201380% of cases. GPS trackers and health alert systems help keep patients safe as the disease progresses.',
    stats: [
      { value: '6.7M', label: 'Americans living with Alzheimer\u2019s' },
      { value: '1 in 3', label: 'Seniors die with Alzheimer\u2019s or another dementia' },
      { value: '60%', label: 'Of Alzheimer\u2019s patients will wander at least once' }
    ]
  },
  'diabetes-body-composition': {
    tag: 'metabolism',
    name: 'Type 2 Diabetes & Body Composition',
    brief: 'Type 2 diabetes is a chronic metabolic condition where the body becomes resistant to insulin or doesn\u2019t produce enough, causing blood sugar to build up. Body composition monitoring helps track visceral fat \u2014 the strongest modifiable risk factor.',
    stats: [
      { value: '37M', label: 'Americans with diabetes (90\u201395% Type 2)' },
      { value: '96M', label: 'U.S. adults with prediabetes' },
      { value: '1 in 5', label: 'Don\u2019t know they have diabetes' }
    ]
  },
  'diabetes-ketone-monitors': {
    tag: 'metabolism',
    name: 'Diabetes & Ketone Monitoring',
    brief: 'Diabetic ketoacidosis (DKA) is a life-threatening complication where the body produces excess blood ketones. Home ketone monitoring is essential for people with diabetes to detect rising ketone levels before they become dangerous.',
    stats: [
      { value: '37M', label: 'Americans living with diabetes' },
      { value: '200K+', label: 'DKA hospital admissions per year in the U.S.' },
      { value: '1%', label: 'DKA mortality rate (higher in elderly)' }
    ]
  },
  'drug-test-kits': {
    tag: 'substance',
    name: 'Drug Screening & Substance Detection',
    brief: 'Home drug testing provides a private, convenient way to screen for substance use. Widely used by parents, employers, healthcare providers, and individuals in recovery programs to monitor compliance and support sobriety.',
    stats: [
      { value: '48M', label: 'Americans used illicit drugs in the past year' },
      { value: '9.5M', label: 'Adults with substance use disorder needing treatment' },
      { value: '107K', label: 'Drug overdose deaths per year in the U.S.' }
    ]
  },
  'electric-toothbrushes': {
    tag: 'dental',
    name: 'Oral Health & Electric Toothbrushes',
    brief: 'Oral disease is the most common chronic condition worldwide. Electric toothbrushes remove significantly more plaque than manual brushing, reducing the risk of cavities, gum disease, and the systemic health effects of poor oral hygiene.',
    stats: [
      { value: '3.5B', label: 'People worldwide have oral diseases' },
      { value: '47%', label: 'Of U.S. adults have some form of gum disease' },
      { value: '21%', label: 'More plaque removed by electric vs. manual brushing' }
    ]
  },
  'endurance-training-breathing-trainer': {
    tag: 'fitness',
    name: 'Endurance Training & Breathing',
    brief: 'Endurance performance is limited by respiratory muscle fatigue \u2014 your breathing muscles tire before your legs do. Inspiratory muscle training strengthens the diaphragm, delaying fatigue and improving VO\u2082 max.',
    stats: [
      { value: '15%', label: 'Average time-to-exhaustion improvement' },
      { value: '2.7%', label: 'Typical VO\u2082 max improvement with IMT' },
      { value: '4\u20136 wks', label: 'To see measurable endurance benefits' }
    ]
  },
  'heart-failure-pulse-oximeter': {
    tag: 'heart',
    name: 'Heart Failure',
    brief: 'Heart failure is a progressive condition where the heart can\u2019t pump blood efficiently enough to meet the body\u2019s needs. It causes fluid buildup, shortness of breath, and fatigue. Home monitoring of oxygen levels and symptoms is critical for management.',
    stats: [
      { value: '6.2M', label: 'Americans living with heart failure' },
      { value: '50%', label: 'Five-year mortality rate after diagnosis' },
      { value: '1M+', label: 'Hospitalizations per year in the U.S.' }
    ]
  },
  'hereditary-genetic-testing': {
    tag: 'immune',
    name: 'Hereditary Disease & Genetic Testing',
    brief: 'Genetic testing identifies inherited mutations that increase risk for conditions like cancer, heart disease, and rare genetic disorders. Home genetic tests empower individuals to understand their risk profile and take preventive action.',
    stats: [
      { value: '1 in 10', label: 'People carry a clinically significant genetic variant' },
      { value: '6,000+', label: 'Known genetic disorders' },
      { value: '30%', label: 'Of diseases have a genetic component' }
    ]
  },
  'hiv': {
    tag: 'immune',
    name: 'HIV / AIDS',
    brief: 'HIV (Human Immunodeficiency Virus) attacks the immune system, destroying CD4 cells that fight infection. Without treatment, it progresses to AIDS. Modern antiretroviral therapy can make HIV undetectable and untransmittable.',
    stats: [
      { value: '1.2M', label: 'Americans living with HIV' },
      { value: '13%', label: 'Don\u2019t know they\u2019re infected' },
      { value: '36K', label: 'New HIV infections per year in the U.S.' }
    ]
  },
  'hypertension': {
    tag: 'heart',
    name: 'Hypertension (High Blood Pressure)',
    brief: 'Hypertension is a chronic condition where blood pushes against artery walls with too much force, silently damaging blood vessels and increasing the risk of heart attack, stroke, kidney disease, and vision loss over time.',
    stats: [
      { value: '1.28B', label: 'People affected worldwide' },
      { value: '47%', label: 'Of U.S. adults have hypertension' },
      { value: '#1', label: 'Modifiable risk factor for heart disease & stroke' }
    ]
  },
  'hypotension-blood-pressure-monitor': {
    tag: 'heart',
    name: 'Hypotension (Low Blood Pressure)',
    brief: 'Hypotension is abnormally low blood pressure (below 90/60 mmHg) that can cause dizziness, fainting, and in severe cases, shock. It\u2019s often underdiagnosed and can be caused by dehydration, medications, or underlying conditions.',
    stats: [
      { value: '~5%', label: 'Of the general population affected' },
      { value: '20\u201330%', label: 'Of elderly experience orthostatic hypotension' },
      { value: '90/60', label: 'mmHg threshold for clinical hypotension' }
    ]
  },
  'insulin-resistance-body-composition': {
    tag: 'metabolism',
    name: 'Insulin Resistance',
    brief: 'Insulin resistance occurs when cells in muscles, fat, and liver don\u2019t respond well to insulin, causing the pancreas to produce more. It\u2019s the precursor to Type 2 diabetes and is strongly linked to visceral fat accumulation.',
    stats: [
      { value: '88M', label: 'U.S. adults have prediabetes/insulin resistance' },
      { value: '84%', label: 'Don\u2019t know they have it' },
      { value: '70%', label: 'Will develop Type 2 diabetes without intervention' }
    ]
  },
  'ketogenic-diet-ketone-monitor': {
    tag: 'metabolism',
    name: 'Ketogenic Diet & Ketone Monitoring',
    brief: 'The ketogenic diet is a very low-carb, high-fat eating plan that shifts the body into ketosis \u2014 burning fat for fuel instead of glucose. Blood ketone monitoring confirms nutritional ketosis and helps optimize the diet.',
    stats: [
      { value: '0.5\u20133.0', label: 'mmol/L \u2014 optimal nutritional ketosis range' },
      { value: '25M+', label: 'Americans have tried a ketogenic diet' },
      { value: '2\u20134 wks', label: 'Typical time to become fully fat-adapted' }
    ]
  },
  'long-covid-pulse-oximeter': {
    tag: 'lung',
    name: 'Long COVID',
    brief: 'Long COVID (post-acute sequelae of SARS-CoV-2) is a chronic condition where symptoms persist or develop weeks to months after initial infection. Fatigue, brain fog, and shortness of breath are the most common lingering symptoms.',
    stats: [
      { value: '65M+', label: 'People estimated to have Long COVID worldwide' },
      { value: '10\u201330%', label: 'Of COVID survivors develop long-term symptoms' },
      { value: '200+', label: 'Documented Long COVID symptoms' }
    ]
  },
  'male-fertility': {
    tag: 'reproductive',
    name: 'Male Infertility',
    brief: 'Male infertility contributes to roughly half of all couples\u2019 difficulty conceiving. It\u2019s most often caused by low sperm count, poor motility, or abnormal morphology. Home testing now allows private, early screening.',
    stats: [
      { value: '~50%', label: 'Of infertility cases involve a male factor' },
      { value: '1 in 6', label: 'Couples experience difficulty conceiving' },
      { value: '40\u201350%', label: 'Decline in sperm counts over the past 40 years' }
    ]
  },
  'menopause-body-composition': {
    tag: 'reproductive',
    name: 'Menopause',
    brief: 'Menopause marks the end of a woman\u2019s reproductive years, typically occurring between ages 45\u201355. Declining estrogen triggers significant body composition changes including increased visceral fat, bone loss, and metabolic shifts.',
    stats: [
      { value: '1.3B', label: 'Women worldwide in menopause or perimenopause' },
      { value: '51', label: 'Average age of menopause in the U.S.' },
      { value: '5\u20138%', label: 'Average body fat increase during menopause transition' }
    ]
  },
  'metabolic-syndrome-body-composition': {
    tag: 'heart',
    name: 'Metabolic Syndrome',
    brief: 'Metabolic syndrome is a cluster of conditions \u2014 high blood pressure, high blood sugar, excess waist fat, and abnormal cholesterol \u2014 that occur together, dramatically increasing the risk of heart disease, stroke, and Type 2 diabetes.',
    stats: [
      { value: '35%', label: 'Of U.S. adults have metabolic syndrome' },
      { value: '5\u00d7', label: 'Higher risk of developing Type 2 diabetes' },
      { value: '2\u00d7', label: 'Higher risk of heart disease and stroke' }
    ]
  },
  'neuropathy-foot-support': {
    tag: 'brain',
    name: 'Peripheral Neuropathy (Foot Care)',
    brief: 'Peripheral neuropathy is nerve damage in the hands and feet causing numbness, tingling, burning pain, and loss of sensation. Proper foot support is critical to prevent injuries that patients may not feel due to nerve damage.',
    stats: [
      { value: '20M+', label: 'Americans affected by peripheral neuropathy' },
      { value: '60\u201370%', label: 'Of people with diabetes develop neuropathy' },
      { value: '100+', label: 'Known causes of peripheral neuropathy' }
    ]
  },
  'neuropathy-tens-units': {
    tag: 'brain',
    name: 'Neuropathy Pain Management',
    brief: 'Neuropathic pain is caused by damaged or dysfunctional nerves sending incorrect pain signals. TENS therapy provides non-drug relief by delivering gentle electrical impulses that modulate pain pathways and reduce discomfort.',
    stats: [
      { value: '20M+', label: 'Americans with peripheral neuropathy' },
      { value: '7\u201310%', label: 'Of the global population has neuropathic pain' },
      { value: '50%', label: 'Of diabetic neuropathy patients have pain' }
    ]
  },
  'obesity': {
    tag: 'metabolism',
    name: 'Obesity',
    brief: 'Obesity is a complex chronic disease characterized by excess body fat (BMI \u226530) that increases the risk of heart disease, Type 2 diabetes, certain cancers, and premature death. It\u2019s driven by genetic, environmental, and behavioral factors.',
    stats: [
      { value: '42%', label: 'Of U.S. adults are obese (BMI \u226530)' },
      { value: '650M', label: 'Adults worldwide classified as obese' },
      { value: '200+', label: 'Health conditions linked to obesity' }
    ]
  },
  'oral-health-diabetes-toothbrush': {
    tag: 'dental',
    name: 'Oral Health in Diabetes',
    brief: 'Diabetes and gum disease have a dangerous two-way relationship: high blood sugar fuels oral bacteria growth, while severe gum disease makes blood sugar harder to control. Intensive oral care is essential for diabetic patients.',
    stats: [
      { value: '22%', label: 'Of diabetics have periodontal disease' },
      { value: '2\u20133\u00d7', label: 'Higher gum disease risk for diabetic patients' },
      { value: '37M', label: 'Americans with diabetes need enhanced oral care' }
    ]
  },
  'osteoporosis-body-composition': {
    tag: 'bone-joint',
    name: 'Osteoporosis',
    brief: 'Osteoporosis is a bone disease where decreased bone density and quality increase fracture risk. Often called a \u201csilent disease,\u201d it progresses without symptoms until a fracture occurs. Body composition monitors can track bone mineral content.',
    stats: [
      { value: '10M', label: 'Americans with osteoporosis' },
      { value: '44M', label: 'With low bone density (osteopenia)' },
      { value: '1 in 2', label: 'Women over 50 will break a bone due to osteoporosis' }
    ]
  },
  'ovulation-test-kits': {
    tag: 'reproductive',
    name: 'Ovulation & Fertility Tracking',
    brief: 'Ovulation testing detects the luteinizing hormone (LH) surge that precedes egg release, identifying the 2\u20133 day fertility window each month. Accurate timing is the single most important factor for natural conception.',
    stats: [
      { value: '12%', label: 'Of U.S. couples have difficulty conceiving' },
      { value: '24\u201336 hrs', label: 'Fertile window after LH surge detection' },
      { value: '80%', label: 'Of couples conceive within 6 months with timed intercourse' }
    ]
  },
  'oxidative-stress-antioxidant-supplements': {
    tag: 'metabolism',
    name: 'Oxidative Stress & Antioxidants',
    brief: 'Oxidative stress occurs when harmful free radicals overwhelm the body\u2019s antioxidant defenses, damaging cells, proteins, and DNA. It\u2019s implicated in aging, cancer, cardiovascular disease, and neurodegenerative disorders.',
    stats: [
      { value: '90%', label: 'Of chronic diseases involve oxidative stress' },
      { value: '$5B+', label: 'Global antioxidant supplement market' },
      { value: '8,000+', label: 'Types of antioxidants identified in nature' }
    ]
  },
  'parkinsons-fall-detection': {
    tag: 'brain',
    name: 'Parkinson\u2019s Disease',
    brief: 'Parkinson\u2019s disease is a progressive neurological disorder that affects movement, causing tremors, stiffness, slowness, and balance problems. Falls are the leading cause of injury and hospitalization in Parkinson\u2019s patients.',
    stats: [
      { value: '1M+', label: 'Americans living with Parkinson\u2019s disease' },
      { value: '90K', label: 'New diagnoses per year in the U.S.' },
      { value: '60%', label: 'Of Parkinson\u2019s patients fall each year' }
    ]
  },
  'pcos-ovulation-monitor': {
    tag: 'reproductive',
    name: 'Polycystic Ovary Syndrome (PCOS)',
    brief: 'PCOS is a hormonal disorder affecting women of reproductive age, causing irregular periods, excess androgen, and polycystic ovaries. It\u2019s the most common cause of female infertility and increases risk for diabetes and heart disease.',
    stats: [
      { value: '10%', label: 'Of women of reproductive age affected' },
      { value: '#1', label: 'Cause of female infertility' },
      { value: '70%', label: 'Of PCOS cases are undiagnosed worldwide' }
    ]
  },
  'percussion-massage-guns': {
    tag: 'brain',
    name: 'Chronic Pain & Muscle Recovery',
    brief: 'Chronic pain affects more Americans than diabetes, heart disease, and cancer combined. Percussion massage therapy targets deep muscle tissue, increasing blood flow, reducing inflammation, and breaking up myofascial adhesions.',
    stats: [
      { value: '50M+', label: 'Americans with chronic pain' },
      { value: '20M', label: 'Experience high-impact chronic pain' },
      { value: '$635B', label: 'Annual cost of chronic pain in the U.S.' }
    ]
  },
  'plantar-fasciitis-foot-support': {
    tag: 'bone-joint',
    name: 'Plantar Fasciitis',
    brief: 'Plantar fasciitis is inflammation of the thick band of tissue connecting the heel bone to the toes, causing stabbing heel pain \u2014 especially with the first steps in the morning. It\u2019s the most common cause of heel pain.',
    stats: [
      { value: '2M+', label: 'Cases treated per year in the U.S.' },
      { value: '10%', label: 'Of the population will develop plantar fasciitis' },
      { value: '90%', label: 'Improve with conservative treatment within 10 months' }
    ]
  },
  'post-surgical-rehab-tens': {
    tag: 'bone-joint',
    name: 'Post-Surgical Rehabilitation',
    brief: 'Post-surgical rehabilitation uses targeted therapies to restore function, reduce pain, and accelerate healing after orthopedic surgery. TENS units are widely used to manage post-operative pain without increasing opioid use.',
    stats: [
      { value: '50M+', label: 'Surgeries performed annually in the U.S.' },
      { value: '30\u201340%', label: 'Reduction in opioid use with TENS post-surgery' },
      { value: '4\u201312 wks', label: 'Typical rehabilitation timeline' }
    ]
  },
  'pregnancy-tests': {
    tag: 'reproductive',
    name: 'Pregnancy',
    brief: 'Home pregnancy tests detect human chorionic gonadotropin (hCG) in urine, a hormone produced after a fertilized egg implants. Early and accurate detection is critical for timely prenatal care and healthy pregnancy outcomes.',
    stats: [
      { value: '3.6M', label: 'Births per year in the United States' },
      { value: '99%', label: 'Accuracy of modern home pregnancy tests' },
      { value: '6 days', label: 'Before missed period \u2014 earliest reliable detection' }
    ]
  },
  'shiatsu-neck-massagers': {
    tag: 'brain',
    name: 'Neck & Shoulder Pain',
    brief: 'Neck and shoulder pain affects up to 70% of adults at some point, often caused by poor posture, desk work, stress, or injury. Shiatsu massage applies rhythmic pressure to trigger points, relieving muscle tension and improving mobility.',
    stats: [
      { value: '70%', label: 'Of adults experience neck pain in their lifetime' },
      { value: '30%', label: 'Becomes chronic (lasting >3 months)' },
      { value: '#4', label: 'Leading cause of disability globally' }
    ]
  },
  'sleep-apnea': {
    tag: 'lung',
    name: 'Sleep Apnea',
    brief: 'Sleep apnea is a serious sleep disorder where breathing repeatedly stops and starts during sleep. Obstructive sleep apnea (OSA) \u2014 caused by throat muscle relaxation \u2014 is the most common form and is heavily underdiagnosed.',
    stats: [
      { value: '30M', label: 'Americans have obstructive sleep apnea' },
      { value: '80%', label: 'Of moderate-to-severe cases are undiagnosed' },
      { value: '2\u20134\u00d7', label: 'Higher risk of heart attack and stroke' }
    ]
  },
  'sports-injuries-tens': {
    tag: 'bone-joint',
    name: 'Sports Injuries',
    brief: 'Sports injuries include sprains, strains, fractures, and overuse injuries sustained during physical activity. TENS therapy and proper support devices accelerate recovery, reduce pain, and help athletes return to activity faster.',
    stats: [
      { value: '8.6M', label: 'Sports and recreation injuries per year in the U.S.' },
      { value: '50%', label: 'Are preventable with proper conditioning' },
      { value: '$30B', label: 'Annual cost of sports injuries in the U.S.' }
    ]
  },
  'sti-home-testing': {
    tag: 'immune',
    name: 'STI Screening',
    brief: 'Sexually transmitted infections (STIs) are among the most common infectious diseases. Many STIs have no visible symptoms but can cause serious long-term health problems if untreated. Home testing removes barriers to regular screening.',
    stats: [
      { value: '26M', label: 'New STI infections per year in the U.S.' },
      { value: '1 in 5', label: 'Americans had an STI on any given day in 2018' },
      { value: '50%+', label: 'Of new infections occur in people ages 15\u201324' }
    ]
  },
  'stroke-prevention-blood-pressure': {
    tag: 'heart',
    name: 'Stroke Prevention',
    brief: 'Stroke occurs when blood supply to the brain is blocked (ischemic) or a blood vessel bursts (hemorrhagic), causing brain cell death within minutes. High blood pressure is the #1 modifiable risk factor \u2014 controlling BP cuts stroke risk by 40%.',
    stats: [
      { value: '795K', label: 'Strokes per year in the United States' },
      { value: '#5', label: 'Leading cause of death in the U.S.' },
      { value: '80%', label: 'Of strokes are preventable' }
    ]
  },
  'thermometers': {
    tag: 'immune',
    name: 'Fever & Temperature Monitoring',
    brief: 'Fever is the body\u2019s natural defense mechanism, signaling that the immune system is actively fighting an infection. Accurate temperature monitoring helps determine when medical attention is needed and track illness progression.',
    stats: [
      { value: '100.4\u00b0F', label: '(38\u00b0C) \u2014 clinical threshold for fever' },
      { value: '3\u20134', label: 'Febrile illnesses per year in average children' },
      { value: '#1', label: 'Reason parents bring children to the ER' }
    ]
  },
  'type1-diabetes-glucometer': {
    tag: 'metabolism',
    name: 'Type 1 Diabetes',
    brief: 'Type 1 diabetes is an autoimmune disease where the immune system destroys insulin-producing beta cells in the pancreas. Without insulin, blood sugar rises to dangerous levels. Lifelong insulin therapy and blood glucose monitoring are essential.',
    stats: [
      { value: '1.9M', label: 'Americans living with Type 1 diabetes' },
      { value: '5\u201310%', label: 'Of all diabetes cases are Type 1' },
      { value: '64K', label: 'New Type 1 diagnoses per year in the U.S.' }
    ]
  },
  'uti': {
    tag: 'immune',
    name: 'Urinary Tract Infections (UTI)',
    brief: 'A urinary tract infection occurs when bacteria enter and multiply in the urinary system. UTIs are extremely common, especially in women, and cause painful urination, urgency, and pelvic discomfort. Early detection prevents kidney complications.',
    stats: [
      { value: '8M+', label: 'UTI doctor visits per year in the U.S.' },
      { value: '50\u201360%', label: 'Of women will have at least one UTI in their lifetime' },
      { value: '25%', label: 'Experience recurrent UTIs' }
    ]
  },
  'water-flossers': {
    tag: 'dental',
    name: 'Gum Health & Interdental Care',
    brief: 'Gum (periodontal) disease begins when plaque builds up between teeth and along the gumline. Water flossers use pulsating streams to remove debris and bacteria from areas traditional brushing misses, reducing gingivitis and bleeding.',
    stats: [
      { value: '47%', label: 'Of U.S. adults have some form of gum disease' },
      { value: '70%', label: 'Of adults over 65 have periodontitis' },
      { value: '51%', label: 'More effective at reducing gingivitis vs. string floss' }
    ]
  },
  'weight-management-body-composition': {
    tag: 'metabolism',
    name: 'Weight Management',
    brief: 'Effective weight management goes beyond the scale \u2014 tracking body composition (fat vs. muscle vs. water) reveals whether weight changes reflect fat loss or unhealthy muscle loss. This data-driven approach leads to more sustainable results.',
    stats: [
      { value: '73%', label: 'Of U.S. adults are overweight or obese' },
      { value: '95%', label: 'Of dieters regain weight within 5 years' },
      { value: '25%', label: 'Of weight loss is lean mass without composition tracking' }
    ]
  }
};

// ===== SNAPSHOT CSS =====
const SNAPSHOT_CSS = `
/* ===== CONDITION SNAPSHOT ===== */
.condition-snapshot {
  max-width: 860px;
  margin: 0 auto 8px;
  padding: 0 24px;
}
.snapshot-card {
  background: linear-gradient(135deg, var(--blue-50) 0%, #f0f7ff 100%);
  border: 1px solid var(--blue-200);
  border-left: 4px solid var(--blue-500);
  border-radius: 16px;
  padding: 28px 32px;
}
.snapshot-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(255,255,255,0.7);
}
.snapshot-tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.snapshot-title {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--slate-900);
  margin-bottom: 8px;
}
.snapshot-desc {
  font-size: 0.925rem;
  color: var(--slate-600);
  line-height: 1.7;
  margin-bottom: 24px;
}
.snapshot-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.snapshot-stat {
  background: white;
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  border: 1px solid var(--blue-100);
}
.snapshot-stat-value {
  display: block;
  font-family: 'DM Sans', sans-serif;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--blue-600);
  margin-bottom: 4px;
}
.snapshot-stat-label {
  display: block;
  font-size: 0.75rem;
  color: var(--slate-500);
  line-height: 1.4;
}
@media (max-width: 640px) {
  .snapshot-stats { grid-template-columns: 1fr; }
  .snapshot-card { padding: 20px; }
  .snapshot-stat { padding: 12px; }
  .snapshot-stat-value { font-size: 1.2rem; }
}`;

// ===== HTML BUILDER =====
function buildSnapshotHTML(slug) {
  const d = DB[slug];
  if (!d) return '';
  const color = TAG_COLORS[d.tag] || '#2563EB';
  const label = TAG_LABELS[d.tag] || d.tag;

  const statsHTML = d.stats.map(s => `
      <div class="snapshot-stat">
        <span class="snapshot-stat-value">${s.value}</span>
        <span class="snapshot-stat-label">${s.label}</span>
      </div>`).join('');

  return `<!-- ============ CONDITION SNAPSHOT ============ -->
<section class="condition-snapshot" data-tag="${d.tag}">
  <div class="snapshot-card">
    <div class="snapshot-tag" style="color:${color}">
      <span class="snapshot-tag-dot" style="background:${color}"></span>
      ${label}
    </div>
    <h2 class="snapshot-title">What is ${d.name}?</h2>
    <p class="snapshot-desc">${d.brief}</p>
    <div class="snapshot-stats">${statsHTML}
    </div>
  </div>
</section>`;
}

// ===== PROCESS INDIVIDUAL CONDITION PAGES =====
function processConditionPage(filename) {
  const filepath = path.join(ROOT, filename);
  let html = fs.readFileSync(filepath, 'utf8');

  if (html.includes('condition-snapshot')) {
    console.log(`  SKIP (already has snapshot): ${filename}`);
    return;
  }

  const slug = filename.replace('healthrankings-', '').replace('.html', '');
  const data = DB[slug];
  if (!data) {
    console.log(`  SKIP (no DB entry): ${filename}`);
    return;
  }

  // 1. Add data-condition-tag to <html>
  if (!html.includes('data-condition-tag')) {
    html = html.replace('<html lang="en">', `<html lang="en" data-condition-tag="${data.tag}">`);
  }

  // 2. Inject CSS before </style>
  html = html.replace('</style>', SNAPSHOT_CSS + '\n</style>');

  // 3. Inject snapshot HTML before jump-nav
  const snapshot = buildSnapshotHTML(slug);
  const jumpNavPattern = /(<!-- ={3,} JUMP NAV ={3,} -->)/;
  if (jumpNavPattern.test(html)) {
    html = html.replace(jumpNavPattern, snapshot + '\n\n$1');
  } else {
    console.log(`  WARN (no jump-nav found): ${filename} — trying alternative injection`);
    const altPattern = /(<\/section>\s*\n\s*<nav class="jump-nav")/;
    if (altPattern.test(html)) {
      html = html.replace(altPattern, `</section>\n\n${snapshot}\n\n<nav class="jump-nav"`);
    } else {
      console.log(`  ERROR: Could not find injection point in ${filename}`);
      return;
    }
  }

  fs.writeFileSync(filepath, html);
  console.log(`  \u2713 ${filename} [tag: ${data.tag}]`);
}

// ===== UPDATE CONDITIONS CATALOG PAGE =====
function updateConditionsCatalog() {
  const filepath = path.join(ROOT, 'healthrankings-conditions.html');
  let html = fs.readFileSync(filepath, 'utf8');

  if (html.includes('data-tag=')) {
    console.log('  SKIP catalog (already has data-tag)');
    return;
  }

  const catToTag = {
    cardiovascular: 'heart',
    respiratory: 'lung',
    neurological: 'brain',
    metabolic: 'metabolism',
    musculoskeletal: 'bone-joint',
    reproductive: 'reproductive',
    dental: 'dental',
    infectious: 'immune',
    fitness: 'fitness',
    substance: 'substance',
    gastrointestinal: 'immune'
  };

  // Override specific cards based on their href (for more accurate tagging)
  const hrefOverrides = {
    'healthrankings-metabolic-syndrome-body-composition.html': 'heart',
    'healthrankings-percussion-massage-guns.html': 'brain',
    'healthrankings-shiatsu-neck-massagers.html': 'brain'
  };

  // Add data-tag to each card
  html = html.replace(
    /(<(?:a|div)\s+(?:href="([^"]*)")?\s*class="cond-card[^"]*"\s+data-cat="([^"]*)")/g,
    (match, full, href, cat) => {
      let tag = catToTag[cat] || cat;
      if (href && hrefOverrides[href]) tag = hrefOverrides[href];
      return `${full} data-tag="${tag}"`;
    }
  );

  // Also add data-tag to "no-page" cards
  html = html.replace(
    /(<div\s+class="cond-card no-page"\s+data-cat="([^"]*)")/g,
    (match, full, cat) => {
      const tag = catToTag[cat] || cat;
      return `${full} data-tag="${tag}"`;
    }
  );

  fs.writeFileSync(filepath, html);
  console.log('  \u2713 healthrankings-conditions.html [data-tag added to all cards]');
}

// ===== MAIN =====
const SKIP_FILES = new Set([
  'healthrankings-homepage.html',
  'healthrankings-conditions.html',
  'healthrankings-devices.html',
  'healthrankings-about.html',
  'healthrankings-drugs.html',
  'healthrankings-news.html',
  'healthrankings-preview.html'
]);

const files = fs.readdirSync(ROOT)
  .filter(f => f.startsWith('healthrankings-') && f.endsWith('.html'))
  .filter(f => !f.includes('-top5'))
  .filter(f => !f.includes('-all-'))
  .filter(f => !f.includes('-review-'))
  .filter(f => !SKIP_FILES.has(f))
  .sort();

console.log(`\n=== Adding condition snapshots to ${files.length} pages ===\n`);
files.forEach(processConditionPage);

console.log(`\n=== Updating conditions catalog ===\n`);
updateConditionsCatalog();

console.log('\nDone!\n');
