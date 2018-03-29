CREATE OR REPLACE FUNCTION delete_from_task()
  RETURNS trigger AS
$BODY$
BEGIN
    DELETE FROM _tasks WHERE task_id = OLD.task_id;
    RETURN OLD;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER delete_tasks INSTEAD OF DELETE ON tasks FOR EACH ROW EXECUTE PROCEDURE delete_from_task();

CREATE OR REPLACE FUNCTION insert_new_task()
  RETURNS trigger AS
$BODY$
DECLARE
    v_temp integer;
BEGIN
    v_temp := NULL;
    IF NEW.origin_file IS NOT NULL THEN
        INSERT INTO uploads(origin_file, stored_name) VALUES (NEW.origin_file, NEW.stored_name) RETURNING upload_id INTO v_temp;
    END IF;
    INSERT INTO _tasks(title, description, upload_id, during) VALUES (NEW.title, NEW.description, v_temp, NEW.during) RETURNING task_id INTO NEW.task_id;
    RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER insert_tasks INSTEAD OF INSERT ON tasks FOR EACH ROW EXECUTE PROCEDURE insert_new_task();

create OR REPLACE function user_accept_task() returns TRIGGER as $$
BEGIN
    UPDATE _tasks SET accepted = accepted + 1 WHERE task_id = NEW.task_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE TRIGGER _insert_assignments AFTER INSERT ON _assignments FOR EACH ROW EXECUTE PROCEDURE user_accept_task();


CREATE OR REPLACE function user_update_task() returns TRIGGER as $$
BEGIN
    IF NEW.accepted IS NOT NULL AND NEW.accepted IS DISTINCT FROM OLD.accepted THEN
        UPDATE _tasks SET accepted = accepted + CASE WHEN NEW.accepted THEN 1 ELSE -1 END WHERE task_id = NEW.task_id;
    END IF;
    IF NEW.submitted IS NOT NULL AND NEW.submitted IS DISTINCT FROM OLD.submitted THEN
        UPDATE _tasks SET submitted = submitted + CASE WHEN NEW.submitted THEN 1 ELSE -1 END WHERE task_id = NEW.task_id;
    END IF;
    IF NEW.approved IS NOT NULL AND NEW.approved IS DISTINCT FROM OLD.approved THEN
        UPDATE _tasks SET approved = approved + CASE WHEN (NEW.approved >= 0) THEN 1 ELSE -1 END WHERE task_id = NEW.task_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE TRIGGER _update_assignments AFTER UPDATE ON _assignments FOR EACH ROW EXECUTE PROCEDURE user_update_task();

CREATE OR REPLACE FUNCTION insert_new_assignment()
  RETURNS trigger AS
$BODY$
BEGIN
    INSERT INTO _assignments(task_id, user_id) VALUES (NEW.task_id, NEW.user_id) RETURNING task_id INTO NEW.task_id;
    RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER insert_assignments INSTEAD OF INSERT ON assignments FOR EACH ROW EXECUTE PROCEDURE insert_new_assignment();

CREATE OR REPLACE FUNCTION update_existing_assignment()
  RETURNS trigger AS
$BODY$
DECLARE
    v_temp integer;
BEGIN
    v_temp := NULL;
    IF OLD.approved = TRUE AND NEW.score <> -1 THEN
        RETURN NULL;
    END IF;

    IF NEW.origin_file IS NOT NULL THEN
        INSERT INTO uploads(origin_file, stored_name) VALUES (NEW.origin_file, NEW.stored_name) RETURNING upload_id INTO v_temp;
        NEW.upload_id = v_temp;
    END IF;

    UPDATE _assignments SET accepted = COALESCE(NEW.accepted, accepted)
        , submitted = COALESCE(NEW.submitted, submitted)
        , approved = COALESCE(NEW.score, approved)
        , upload_id = CASE WHEN COALESCE(NEW.submitted, submitted) THEN COALESCE(v_temp, upload_id) ELSE NULL END
        , since = current_timestamp
        WHERE user_id = NEW.user_id and task_id = NEW.task_id
        RETURNING task_id INTO NEW.task_id;
    RETURN NEW;
END;
$BODY$
LANGUAGE plpgsql;

CREATE TRIGGER update_assignments INSTEAD OF UPDATE ON assignments FOR EACH ROW EXECUTE PROCEDURE update_existing_assignment();

CREATE OR REPLACE function insert_new_feed_stars() returns TRIGGER as $$
DECLARE
    v_temp integer;
BEGIN
    UPDATE _feeds SET starred = starred + 1 WHERE feed_id = NEW.feed_id RETURNING starred into v_temp;
    RAISE NOTICE '%',v_temp;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE TRIGGER insert_feed_stars AFTER INSERT ON feed_stars FOR EACH ROW EXECUTE PROCEDURE insert_new_feed_stars();

create OR REPLACE function remove_existing_feed_stars() returns TRIGGER as $$
BEGIN
    UPDATE _feeds SET starred = starred - 1 WHERE feed_id = OLD.feed_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE TRIGGER remove_feed_stars AFTER DELETE ON feed_stars FOR EACH ROW EXECUTE PROCEDURE remove_existing_feed_stars();
