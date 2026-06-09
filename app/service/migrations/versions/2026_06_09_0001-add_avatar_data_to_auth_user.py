"""add_avatar_data_to_auth_user

Revision ID: b3c4d5e6f7a8
Revises: 7adaa559ed82
Create Date: 2026-06-09 00:01:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, None] = '7adaa559ed82'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'auth_user',
        sa.Column('avatar_data', sa.Text(), nullable=True),
        schema='mynab'
    )


def downgrade() -> None:
    op.drop_column('auth_user', 'avatar_data', schema='mynab')
