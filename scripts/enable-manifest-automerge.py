"""Enable auto-merge only for the generated manifest PR behind real required checks."""
import argparse
import json
import subprocess

REQUIRED = {'Build', 'Workflow validation', 'Dependency review'}
BRANCH = 'automation/update-manifest'


def validate(pr, files, rules, sha):
    if (pr['state'] != 'open' or pr['draft'] or pr['base']['ref'] != 'main'
            or pr['head']['ref'] != BRANCH or pr['head']['sha'] != sha
            or pr['head']['repo']['full_name'] != pr['base']['repo']['full_name']):
        raise ValueError('Unexpected manifest PR source, target, state or commit')
    if files != ['public/update.json']:
        raise ValueError('Manifest automation may only change public/update.json')
    checks = {c['context'] for rule in rules if rule['type'] == 'required_status_checks'
              for c in rule['parameters']['required_status_checks']
              if c.get('integration_id') == 15368}
    if not REQUIRED <= checks or not any(r['type'] == 'pull_request' for r in rules):
        raise ValueError('Main must require a PR and the GitHub Actions build/quality checks')


def api(path):
    return json.loads(subprocess.check_output(['gh', 'api', path], text=True))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', required=True)
    parser.add_argument('--pr', type=int, required=True)
    parser.add_argument('--sha', required=True)
    args = parser.parse_args()
    prefix = f'repos/{args.repo}'
    pr = api(f'{prefix}/pulls/{args.pr}')
    # Fail closed instead of accepting a truncated file list.
    if pr['changed_files'] != 1:
        raise ValueError('Expected exactly one changed manifest file')
    files = [f['filename'] for f in api(f'{prefix}/pulls/{args.pr}/files')]
    validate(pr, files, api(f'{prefix}/rules/branches/main'), args.sha)
    subprocess.run(['gh', 'pr', 'merge', str(args.pr), '--repo', args.repo,
                    '--auto', '--squash', '--match-head-commit', args.sha], check=True)


if __name__ == '__main__':
    main()
