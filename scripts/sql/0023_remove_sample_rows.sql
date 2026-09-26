-- Remove seeded sample data so the console only shows real work.
-- Safe to run more than once. Real rows (manual/cron/event runs, approval
-- tasks carrying a tool call, recorded footprints) are kept.

begin;

-- Sample agent runs and the tasks seeded with no run and no tool call.
delete from agent_runs where trigger = 'sample';
delete from agent_tasks
 where run_id is null and pending_tool is null
   and workspace_id in ('ws_demo_cy', 'ws_qa_console_agent');

-- Seeded metric series (agent/bill readings no connector ever produced).
delete from metric_readings
 where source in ('agent', 'bill')
   and workspace_id in ('ws_demo_cy', 'ws_qa_console_agent');

-- Stored connection rows are no longer read; the dashboard derives them live.
delete from data_connections;

-- Obligations keep their dates, but invented progress and status are reset.
update obligations set progress_pct = 0, status = 'planned'
 where workspace_id in ('ws_demo_cy', 'ws_qa_console_agent');

-- The unused demo workspace.
delete from obligations where workspace_id = 'ws_demo_cy';
delete from activity_events where workspace_id = 'ws_demo_cy';
delete from workspaces where id = 'ws_demo_cy';

commit;
