import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('gate', Path(__file__).with_name('enable-manifest-automerge.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class ManifestGate(unittest.TestCase):
    def setUp(self):
        repo = {'full_name': 'metasequoiaime/MSIME-Web'}
        self.pr = dict(state='open', draft=False, base=dict(ref='main', repo=repo),
                       head=dict(ref=gate.BRANCH, repo=repo, sha='a' * 40))
        self.rules = [dict(type='pull_request'), dict(type='required_status_checks',
            parameters=dict(required_status_checks=[dict(context=c, integration_id=15368) for c in gate.REQUIRED]))]

    def test_valid_protected_manifest(self):
        gate.validate(self.pr, ['public/update.json'], self.rules, 'a' * 40)

    def test_rejects_unprotected_main_and_spoofed_checks(self):
        for rules in [[], self.rules[:1], self.rules[1:]]:
            with self.assertRaises(ValueError):
                gate.validate(self.pr, ['public/update.json'], rules, 'a' * 40)
        rules = copy.deepcopy(self.rules)
        rules[1]['parameters']['required_status_checks'][0]['integration_id'] = 1
        with self.assertRaises(ValueError):
            gate.validate(self.pr, ['public/update.json'], rules, 'a' * 40)

    def test_rejects_fork_moved_head_and_other_files(self):
        for files in [[], ['public/update.json', '.github/workflows/ci.yml']]:
            with self.assertRaises(ValueError):
                gate.validate(self.pr, files, self.rules, 'a' * 40)
        for field, value in [('sha', 'b' * 40), ('ref', 'unexpected'),
                             ('repo', {'full_name': 'fork/MSIME-Web'})]:
            pr = copy.deepcopy(self.pr)
            pr['head'][field] = value
            with self.assertRaises(ValueError):
                gate.validate(pr, ['public/update.json'], self.rules, 'a' * 40)


if __name__ == '__main__':
    unittest.main()
