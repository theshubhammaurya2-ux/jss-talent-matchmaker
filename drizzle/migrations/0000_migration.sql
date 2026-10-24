create table public.skill_categories (code text primary key, name text not null);
create table public.companies (id uuid primary key default gen_random_uuid(), name text not null unique);
create table public.company_skillsets (id uuid primary key default gen_random_uuid(), company text not null, category_code text not null, required_level int not null);
create table public.job_descriptions (id uuid primary key default gen_random_uuid(), source_file text not null, company text, role text, created_at timestamptz not null default now());
create table public.jd_skills (id uuid primary key default gen_random_uuid(), jd_id uuid not null references public.job_descriptions(id) on delete cascade, skill_name text not null, category_code text not null, evidence text, confidence text not null);
create table public.candidates (id uuid primary key default gen_random_uuid(), name text not null, email text not null, education text, hackathons jsonb not null default '[]', internships jsonb not null default '[]', certifications jsonb not null default '[]', preferred_roles jsonb not null default '[]', cv_file text, created_at timestamptz not null default now());
create table public.candidate_skills (id uuid primary key default gen_random_uuid(), candidate_id uuid not null references public.candidates(id) on delete cascade, skill_name text not null, category_code text not null, evidence text, confidence text not null);
create table public.talent_results (id uuid primary key default gen_random_uuid(), candidate_id uuid references public.candidates(id) on delete cascade, company text not null, readiness_score int not null, created_at timestamptz not null default now());
create table public.talent_result_gaps (id uuid primary key default gen_random_uuid(), talent_result_id uuid not null references public.talent_results(id) on delete cascade, category_code text not null, required_level int not null, candidate_level int not null, gap boolean not null);
create table public.match_results (id uuid primary key default gen_random_uuid(), candidate_id uuid references public.candidates(id) on delete cascade, jd_id uuid references public.job_descriptions(id) on delete set null, jd_source_file text, match_score int not null, matched_skills jsonb not null default '[]', missing_skills jsonb not null default '[]', created_at timestamptz not null default now());

do $$ declare t text; begin
foreach t in array array['skill_categories','companies','company_skillsets','job_descriptions','jd_skills','candidates','candidate_skills','talent_results','talent_result_gaps','match_results'] loop
  execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
  execute format('grant all on public.%I to service_role', t);
  execute format('alter table public.%I enable row level security', t);
  execute format('create policy "demo access" on public.%I for all to anon, authenticated using (true) with check (true)', t);
end loop; end $$;

insert into public.skill_categories values ('DSA','Data Structures & Algorithms'),('COD','Coding'),('OOD','Object-Oriented Design'),('APTI','Aptitude'),('COMM','Communication'),('AI','AI / ML'),('CLOUD','Cloud'),('SQL','SQL & Databases'),('SWE','Software Engineering'),('SYSD','System Design'),('NETW','Networking'),('OS','Operating Systems'),('OTHER','Other');
insert into public.companies(name) values ('Google'),('TCS'),('Infosys'),('Amazon');
insert into public.company_skillsets(company, category_code, required_level)
select c, k, l from (values
('Google','DSA',9),('Google','COD',9),('Google','OOD',7),('Google','APTI',6),('Google','COMM',6),('Google','AI',6),('Google','CLOUD',5),('Google','SQL',5),('Google','SWE',8),('Google','SYSD',8),('Google','NETW',5),('Google','OS',6),
('Amazon','DSA',8),('Amazon','COD',8),('Amazon','OOD',7),('Amazon','APTI',5),('Amazon','COMM',7),('Amazon','AI',4),('Amazon','CLOUD',8),('Amazon','SQL',6),('Amazon','SWE',7),('Amazon','SYSD',8),('Amazon','NETW',5),('Amazon','OS',5),
('TCS','DSA',5),('TCS','COD',6),('TCS','OOD',5),('TCS','APTI',8),('TCS','COMM',7),('TCS','AI',3),('TCS','CLOUD',4),('TCS','SQL',6),('TCS','SWE',5),('TCS','SYSD',3),('TCS','NETW',4),('TCS','OS',4),
('Infosys','DSA',5),('Infosys','COD',6),('Infosys','OOD',5),('Infosys','APTI',8),('Infosys','COMM',8),('Infosys','AI',4),('Infosys','CLOUD',5),('Infosys','SQL',6),('Infosys','SWE',5),('Infosys','SYSD',3),('Infosys','NETW',4),('Infosys','OS',4)
) v(c,k,l);